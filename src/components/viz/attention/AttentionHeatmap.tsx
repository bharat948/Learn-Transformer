import { Fragment, useMemo, useState } from 'react'

import { ramp } from '../../../lib/viz'

const TOKENS = ['The', 'cat', 'sat', 'because', 'it', 'tired']

// Illustrative fixed pre-softmax scores (row = query token, col = key token).
// Row 4 ("it") is deliberately built to favor "cat" (index 1).
const RAW_SCORES: number[][] = [
  [3, 0.5, 0.5, -1, -1, -1],
  [0.5, 3, 1, -0.5, 0.5, 0],
  [0.2, 1, 3, 0.5, 0.2, 0.5],
  [-1, -0.5, 0.5, 3, -0.5, 0.5],
  [-1, 4.5, -1, -1, 3, 0.5],
  [-1, 1.5, 0.5, 0.5, 1, 3],
]

function softmax(values: number[]): number[] {
  const max = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export default function AttentionHeatmap() {
  const [hoveredRow, setHoveredRow] = useState(4) // default to "it"
  const [scale, setScale] = useState(1)

  const weights = useMemo(
    () => RAW_SCORES.map((row) => softmax(row.map((s) => s * scale))),
    [scale],
  )

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {TOKENS.map((token, i) => (
          <button
            key={token + i}
            type="button"
            onMouseEnter={() => setHoveredRow(i)}
            onFocus={() => setHoveredRow(i)}
            onClick={() => setHoveredRow(i)}
            className={`px-3 py-1.5 text-sm font-medium transition ${
              hoveredRow === i ? 'bg-accent text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {token}
          </button>
        ))}
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `80px repeat(${TOKENS.length}, 1fr)` }}
      >
        <div />
        {TOKENS.map((t) => (
          <div key={t} className="pb-1 text-center text-[10px] font-medium text-ink-faint">
            {t}
          </div>
        ))}
        {TOKENS.map((rowToken, r) => (
          <Fragment key={`row-${r}`}>
            <div className="flex items-center text-xs font-medium text-ink-faint">{rowToken}</div>
            {TOKENS.map((_, c) => {
              const w = weights[r][c]
              const active = r === hoveredRow
              return (
                <div
                  key={`${r}-${c}`}
                  className="flex aspect-square items-center justify-center rounded text-[10px] font-medium text-paper transition-all"
                  style={{
                    backgroundColor: ramp(active ? w : w * 0.35),
                    opacity: active ? 1 : 0.6,
                  }}
                >
                  {active ? w.toFixed(2) : ''}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
          <span>Flatter (low scaling)</span>
          <span className="font-semibold text-ink">
            scaling ×{scale.toFixed(2)} {scale > 1.8 ? '— near one-hot (saturated)' : ''}
          </span>
          <span>Sharper (high scaling)</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.05}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="w-full accent-accent"
        />
        <p className="mt-2 text-xs text-ink-faint">
          This slider stands in for dividing by √d_k: large pre-softmax scores push softmax toward
          a one-hot distribution with vanishing gradients almost everywhere — scaling keeps it
          well-behaved.
        </p>
      </div>
    </div>
  )
}
