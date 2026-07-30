export interface TestCase {
  name: string
  /** Source that runs after the learner's code. Throws to fail. */
  code: string
}

export interface TestResult {
  name: string
  passed: boolean
  error?: string
}

/**
 * Assertion helpers injected above every test so exercises can stay terse.
 * Kept as a source string because it has to be shipped into the worker.
 */
const HELPERS = `
function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}
function assertClose(actual, expected, eps) {
  eps = eps == null ? 1e-6 : eps;
  if (typeof actual !== 'number' || Number.isNaN(actual)) {
    throw new Error('expected a number, got ' + JSON.stringify(actual));
  }
  if (Math.abs(actual - expected) > eps) {
    throw new Error('expected ' + expected + ', got ' + actual);
  }
}
function assertArrayClose(actual, expected, eps) {
  eps = eps == null ? 1e-6 : eps;
  if (!Array.isArray(actual)) {
    throw new Error('expected an array, got ' + JSON.stringify(actual));
  }
  if (actual.length !== expected.length) {
    throw new Error('expected length ' + expected.length + ', got ' + actual.length);
  }
  for (let i = 0; i < expected.length; i++) {
    assertClose(actual[i], expected[i], eps);
  }
}
`

const WORKER_SOURCE = `
self.onmessage = function (event) {
  var code = event.data.code;
  var tests = event.data.tests;
  var helpers = event.data.helpers;
  var results = [];

  for (var i = 0; i < tests.length; i++) {
    var test = tests[i];
    try {
      // eslint-disable-next-line no-new-func
      new Function(helpers + '\\n' + code + '\\n' + test.code)();
      results.push({ name: test.name, passed: true });
    } catch (err) {
      results.push({
        name: test.name,
        passed: false,
        error: (err && err.message) ? String(err.message) : String(err),
      });
    }
  }

  self.postMessage(results);
};
`

const TIMEOUT_MS = 2000

/**
 * Run learner code against a set of assertions inside a Web Worker.
 *
 * The worker matters: an accidental `while (true)` in a learning sandbox would
 * otherwise lock the page. Here it just trips the timeout and gets terminated,
 * and because CodeSandbox persists code on every keystroke, nothing is lost.
 */
export function runTests(code: string, tests: TestCase[]): Promise<TestResult[]> {
  return new Promise((resolve) => {
    let worker: Worker
    let url: string

    try {
      const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' })
      url = URL.createObjectURL(blob)
      worker = new Worker(url)
    } catch (err) {
      resolve(tests.map((t) => ({ name: t.name, passed: false, error: String(err) })))
      return
    }

    const cleanup = () => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
    }

    const timer = setTimeout(() => {
      cleanup()
      resolve(
        tests.map((t) => ({
          name: t.name,
          passed: false,
          error: `Timed out after ${TIMEOUT_MS}ms — check for an infinite loop.`,
        })),
      )
    }, TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<TestResult[]>) => {
      cleanup()
      resolve(event.data)
    }

    worker.onerror = (event) => {
      cleanup()
      resolve(tests.map((t) => ({ name: t.name, passed: false, error: event.message })))
    }

    worker.postMessage({ code, tests, helpers: HELPERS })
  })
}
