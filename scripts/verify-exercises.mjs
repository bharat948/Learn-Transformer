/**
 * Verifies every coding exercise in src/data/exercises.ts:
 *   1. the reference solution passes all of its own tests
 *   2. the starter code does NOT pass them all (otherwise the exercise is a no-op)
 *
 * Run with: npm run verify:exercises
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const outDir = mkdtempSync(join(tmpdir(), 'verify-exercises-'))
const outFile = join(outDir, 'exercises.mjs')

// Mirrors the helpers injected by src/lib/runCode.ts.
const HELPERS = `
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function assertClose(actual, expected, eps) {
  eps = eps == null ? 1e-6 : eps;
  if (typeof actual !== 'number' || Number.isNaN(actual)) throw new Error('expected a number, got ' + JSON.stringify(actual));
  if (Math.abs(actual - expected) > eps) throw new Error('expected ' + expected + ', got ' + actual);
}
function assertArrayClose(actual, expected, eps) {
  eps = eps == null ? 1e-6 : eps;
  if (!Array.isArray(actual)) throw new Error('expected an array, got ' + JSON.stringify(actual));
  if (actual.length !== expected.length) throw new Error('expected length ' + expected.length + ', got ' + actual.length);
  for (let i = 0; i < expected.length; i++) assertClose(actual[i], expected[i], eps);
}
`

try {
  execFileSync(
    'npx',
    [
      'esbuild',
      'src/data/exercises.ts',
      '--bundle',
      '--format=esm',
      `--outfile=${outFile}`,
      '--log-level=error',
    ],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  )

  const { exercises } = await import(pathToFileURL(outFile).href)

  let passed = 0
  const failures = []

  for (const exercise of Object.values(exercises)) {
    for (const test of exercise.tests) {
      try {
        new Function(`${HELPERS}\n${exercise.solution}\n${test.code}`)()
        passed += 1
      } catch (err) {
        failures.push(`${exercise.id} :: ${test.name}\n      ${err.message}`)
      }
    }
  }

  const trivial = Object.values(exercises).filter((exercise) =>
    exercise.tests.every((test) => {
      try {
        new Function(`${HELPERS}\n${exercise.starterCode}\n${test.code}`)()
        return true
      } catch {
        return false
      }
    }),
  )

  for (const failure of failures) console.error(`FAIL  ${failure}`)
  for (const exercise of trivial) {
    console.error(`WARN  ${exercise.id}: starter code already passes every test`)
  }

  console.log(`\nsolutions: ${passed} passed, ${failures.length} failed`)
  console.log(`starter code trivially passing: ${trivial.length}`)

  if (failures.length || trivial.length) process.exit(1)
} finally {
  rmSync(outDir, { recursive: true, force: true })
}
