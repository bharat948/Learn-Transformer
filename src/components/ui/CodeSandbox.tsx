import { useEffect, useMemo, useState } from 'react'

import { getExercise } from '../../data/exercises'
import { useProgress } from '../../lib/progress'
import { runTests, type TestResult } from '../../lib/runCode'

interface CodeSandboxProps {
  exerciseId: string
  lessonId?: string
  milestoneId?: string
}

export default function CodeSandbox({ exerciseId, lessonId, milestoneId }: CodeSandboxProps) {
  const exercise = useMemo(() => getExercise(exerciseId), [exerciseId])
  const { getCode, saveCode, setMilestone } = useProgress()

  const [code, setCode] = useState(() => getCode(exerciseId) ?? exercise.starterCode)
  const [results, setResults] = useState<TestResult[] | null>(null)
  const [running, setRunning] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  const allPassed = results !== null && results.length > 0 && results.every((r) => r.passed)

  // Persist on every keystroke: the worker can be terminated mid-run (infinite
  // loop guard), and a reload should never cost the learner their work.
  useEffect(() => {
    saveCode(exerciseId, code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, exerciseId])

  useEffect(() => {
    if (allPassed && lessonId && milestoneId) {
      setMilestone(lessonId, milestoneId, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPassed, lessonId, milestoneId])

  const handleRun = async () => {
    setRunning(true)
    setResults(await runTests(code, exercise.tests))
    setRunning(false)
  }

  const lineCount = code.split('\n').length

  return (
    <div className="not-prose my-10 border-y border-rule-strong">
      <div className="flex flex-wrap items-baseline justify-between gap-2 py-4">
        <p className="label">Exercise · {exercise.title}</p>
        {exercise.repoRef && (
          <code className="font-mono text-[0.6875rem] text-ink-faint">{exercise.repoRef}</code>
        )}
      </div>

      <p className="mb-4 max-w-measure font-serif text-[1rem] leading-relaxed text-ink-muted">
        {exercise.prompt}
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        rows={Math.min(Math.max(lineCount + 1, 8), 30)}
        className="w-full resize-y border border-rule bg-[#f7f5f1] p-4 font-mono text-[0.8125rem] leading-relaxed text-ink outline-none transition focus:border-ink-faint"
        aria-label={`Code editor for ${exercise.title}`}
      />

      <div className="flex flex-wrap items-center gap-5 py-4">
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          className="border border-accent bg-accent px-4 py-1.5 font-sans text-[0.8125rem] font-medium text-paper transition hover:bg-accent-hover disabled:opacity-50"
        >
          {running ? 'Running' : 'Run tests'}
        </button>
        <button
          type="button"
          onClick={() => {
            setCode(exercise.starterCode)
            setResults(null)
            setShowSolution(false)
          }}
          className="font-sans text-[0.8125rem] text-ink-muted transition hover:text-ink"
        >
          Reset
        </button>
        {exercise.hint && (
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="font-sans text-[0.8125rem] text-ink-muted transition hover:text-ink"
          >
            {showHint ? 'Hide hint' : 'Hint'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSolution((v) => !v)}
          className="ml-auto font-sans text-[0.8125rem] text-ink-faint transition hover:text-ink-muted"
        >
          {showSolution ? 'Hide solution' : 'Solution'}
        </button>
      </div>

      {showHint && exercise.hint && (
        <p className="border-t border-rule py-4 font-serif text-[1rem] italic leading-relaxed text-ink-muted">
          {exercise.hint}
        </p>
      )}

      {results && (
        <div className="border-t border-rule py-4">
          {allPassed && (
            <p className="mb-3 font-sans text-[0.8125rem] font-medium text-accent">
              All {results.length} tests passed — milestone complete.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {results.map((result) => (
              <li key={result.name} className="flex items-baseline gap-3">
                <span
                  className={`shrink-0 font-mono text-[0.625rem] ${
                    result.passed ? 'text-accent' : 'text-ink'
                  }`}
                >
                  {result.passed ? '●' : '×'}
                </span>
                <span className="min-w-0">
                  <span
                    className={`font-sans text-[0.8125rem] ${
                      result.passed ? 'text-ink-faint' : 'text-ink'
                    }`}
                  >
                    {result.name}
                  </span>
                  {result.error && (
                    <span className="mt-1 block break-words font-mono text-[0.6875rem] leading-relaxed text-accent">
                      {result.error}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSolution && (
        <div className="border-t border-rule py-4">
          <p className="label mb-2">Reference solution</p>
          <pre className="overflow-x-auto border border-rule bg-[#f7f5f1] p-4 font-mono text-[0.8125rem] leading-relaxed text-ink">
            {exercise.solution}
          </pre>
        </div>
      )}
    </div>
  )
}
