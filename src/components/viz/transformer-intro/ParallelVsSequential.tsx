import { useState } from 'react'

interface Example {
  label: string
  tokens: string[]
  targetIndex: number // the pronoun/referring word
  referentIndex: number // the correct antecedent
  // Illustrative attention weights from targetIndex to every other token (excludes self).
  weights: number[]
}

const EXAMPLES: Example[] = [
  {
    label: '"...animal...it..."',
    tokens: ['The', 'animal', "didn't", 'cross', 'the', 'street', 'because', 'it', 'was', 'too', 'tired'],
    targetIndex: 7,
    referentIndex: 1,
    weights: [0.02, 0.55, 0.03, 0.08, 0.02, 0.1, 0.03, 0.05, 0.02, 0.1],
  },
  {
    label: '"...trophy...it..."',
    tokens: ['The', 'trophy', "didn't", 'fit', 'in', 'the', 'suitcase', 'because', 'it', 'was', 'too', 'big'],
    targetIndex: 8,
    referentIndex: 1,
    weights: [0.02, 0.5, 0.03, 0.05, 0.02, 0.02, 0.2, 0.03, 0.05, 0.03, 0.05],
  },
]

export default function ParallelVsSequential() {
  const [exampleIdx, setExampleIdx] = useState(0)
  const [rnnStep, setRnnStep] = useState(0)
  const [attended, setAttended] = useState(false)

  const example = EXAMPLES[exampleIdx]
  const otherIndices = example.tokens.map((_, i) => i).filter((i) => i !== example.targetIndex)
  const distance = example.targetIndex - example.referentIndex

  const selectExample = (idx: number) => {
    setExampleIdx(idx)
    setRnnStep(0)
    setAttended(false)
  }

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => selectExample(i)}
            className={`px-3 py-1.5 text-sm font-medium transition ${
              i === exampleIdx ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* RNN panel */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">RNN — one step at a time</p>
            <button
              type="button"
              onClick={() => setRnnStep((s) => (s >= example.tokens.length ? 0 : s + 1))}
              className="bg-[#f2efe9] px-3 py-1 text-xs font-semibold text-ink-muted"
            >
              {rnnStep >= example.tokens.length ? 'Reset' : 'Step →'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {example.tokens.map((token, i) => {
              const reached = i < rnnStep
              const isCurrent = i === rnnStep - 1
              const fade = reached ? Math.max(0.15, 1 - (rnnStep - 1 - i) * 0.15) : 0.15
              return (
                <span
                  key={token + i}
                  className={`rounded px-2 py-1 text-xs font-medium transition-all ${
                    isCurrent ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-faint'
                  }`}
                  style={{ opacity: reached ? fade : 0.35 }}
                >
                  {token}
                </span>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Signal from <strong>"{example.tokens[example.referentIndex]}"</strong> must survive{' '}
            <strong>{distance}</strong> sequential steps to reach "{example.tokens[example.targetIndex]}".
          </p>
        </div>

        {/* Transformer panel */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Transformer — all at once</p>
            <button
              type="button"
              onClick={() => setAttended((a) => !a)}
              className="bg-accent px-3 py-1 text-xs font-semibold text-paper"
            >
              {attended ? 'Reset' : 'Attend →'}
            </button>
          </div>
          <svg viewBox="0 0 300 90" className="w-full">
            {example.tokens.map((_, i) => {
              const x = 12 + i * (276 / (example.tokens.length - 1))
              const isTarget = i === example.targetIndex
              return (
                <g key={i}>
                  {attended && !isTarget && (
                    <line
                      x1={12 + example.targetIndex * (276 / (example.tokens.length - 1))}
                      y1={70}
                      x2={x}
                      y2={70}
                      stroke="#a8422a"
                      strokeWidth={Math.max(0.5, example.weights[otherIndices.indexOf(i)] * 14)}
                      opacity={0.75}
                    />
                  )}
                  <circle cx={x} cy={70} r={isTarget ? 5 : 3.5} fill={isTarget ? '#a8422a' : '#726d64'} />
                </g>
              )
            })}
          </svg>
          <div className="mt-1 flex flex-wrap gap-1">
            {example.tokens.map((token, i) => (
              <span
                key={token + i}
                className={`rounded px-2 py-1 text-xs font-medium ${
                  i === example.targetIndex ? 'bg-accent/10 text-accent' : 'text-ink-faint'
                }`}
              >
                {token}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Path length from "{example.tokens[example.targetIndex]}" to any other token: always{' '}
            <strong>1 step</strong> — heaviest connection lands on{' '}
            <strong>"{example.tokens[example.referentIndex]}"</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
