import { useMemo, useState } from 'react'

import { positional } from '../../../data/artifacts'
import { diverging, series } from '../../../lib/viz'

const D_MODEL = 16
const MAX_LEN = 20

type Variant = 'sinusoidal' | 'learned' | 'none'

function sinusoidalPE(pos: number, dim: number): number {
  const i = Math.floor(dim / 2)
  const angle = pos / Math.pow(10000, (2 * i) / D_MODEL)
  return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle)
}

/**
 * The "learned" view uses the *actual trained* embedding table exported from
 * ablation_pe_learned.pt, sliced to the display window and rescaled to roughly
 * [-1, 1] so it shares a colour scale with the sinusoidal formula.
 */
function learnedMatrix(): number[][] {
  const rows = positional.table.slice(0, MAX_LEN).map((row) => row.slice(0, D_MODEL))
  const peak = Math.max(...rows.flat().map(Math.abs), 1e-6)
  return rows.map((row) => row.map((v) => v / peak))
}

function buildMatrix(variant: Variant): number[][] {
  if (variant === 'none') {
    return Array.from({ length: MAX_LEN }, () => new Array(D_MODEL).fill(0))
  }
  if (variant === 'learned') {
    return learnedMatrix()
  }
  return Array.from({ length: MAX_LEN }, (_, pos) =>
    Array.from({ length: D_MODEL }, (_, dim) => sinusoidalPE(pos, dim)),
  )
}

// Signed values: slate for negative, rust for positive, paper at zero.
const cellColor = diverging

const SENTENCE = ['dog', 'chased', 'cat']
const WORD_COLORS: Record<string, string> = { dog: series(0), chased: series(2), cat: series(1) }

export default function PositionalEncodingHeatmap() {
  const [variant, setVariant] = useState<Variant>('sinusoidal')
  const [position, setPosition] = useState(3)
  const [order, setOrder] = useState<number[]>([0, 1, 2])

  const matrix = useMemo(() => buildMatrix(variant), [variant])
  const positionVector = matrix[position]

  const shuffle = () => {
    setOrder((prev) => {
      const next = [...prev]
      // rotate — deterministic "shuffle" so it's reproducible
      next.push(next.shift() as number)
      return next
    })
  }

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {(['sinusoidal', 'learned', 'none'] as Variant[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVariant(v)}
            className={`px-3 py-1.5 text-sm font-medium capitalize transition ${
              variant === v ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      {variant === 'learned' && (
        <p className="mb-3 text-xs text-accent">
          The <strong>actual trained</strong> table from <code>{positional.source}</code> (
          {positional.maxLen} positions × {positional.dModel} dims, sliced to the window below).
          No smooth wave structure — the model shaped these however training rewarded, and there
          is nothing defined past position {positional.maxLen - 1}.
        </p>
      )}

      <div className="mb-6 overflow-x-auto">
        <div
          className="grid gap-[1px]"
          style={{ gridTemplateColumns: `32px repeat(${D_MODEL}, 1fr)`, minWidth: 480 }}
        >
          <div />
          {Array.from({ length: D_MODEL }, (_, d) => (
            <div key={d} className="pb-1 text-center text-[9px] text-ink-faint">
              {d}
            </div>
          ))}
          {matrix.map((row, pos) => (
            <div key={pos} className="contents">
              <button
                type="button"
                onClick={() => setPosition(pos)}
                className={`pr-1 text-right text-[10px] font-medium ${
                  pos === position ? 'text-accent' : 'text-ink-faint'
                }`}
              >
                {pos}
              </button>
              {row.map((v, d) => (
                <div
                  key={d}
                  onClick={() => setPosition(pos)}
                  className={`aspect-square cursor-pointer rounded-[2px] ${
                    pos === position ? 'ring-1 ring-accent' : ''
                  }`}
                  style={{ backgroundColor: cellColor(v) }}
                  title={`pos ${pos}, dim ${d}: ${v.toFixed(2)}`}
                />
              ))}
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-ink-faint">
          x-axis = embedding dimension (left columns oscillate fast / high frequency, right
          columns oscillate slowly / low frequency) · y-axis = position · click a row to inspect it
          below
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
          <span>position = {position}</span>
          <input
            type="range"
            min={0}
            max={MAX_LEN - 1}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            className="mx-3 flex-1 accent-accent"
          />
        </div>
        <div className="flex h-16 items-end gap-1 bg-[#f2efe9] p-2">
          {positionVector.map((v, d) => (
            <div key={d} className="flex-1 rounded-t" style={{ backgroundColor: cellColor(v) }}>
              <div style={{ height: `${Math.abs(v) * 28}px` }} />
            </div>
          ))}
        </div>
        {variant === 'sinusoidal' && (
          <p className="mt-2 font-mono text-[11px] text-ink-faint">
            PE(pos={position}, 2i) = sin({position} / 10000^(2i/{D_MODEL})) · PE(pos={position}, 2i+1) =
            cos({position} / 10000^(2i/{D_MODEL}))
          </p>
        )}
      </div>

      <div className="border border-rule p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Shuffle the sentence</p>
          <button
            type="button"
            onClick={shuffle}
            className="bg-accent px-3 py-1 text-xs font-semibold text-paper"
          >
            Shuffle →
          </button>
        </div>
        <div className="flex gap-3">
          {order.map((wordIdx, slot) => {
            const word = SENTENCE[wordIdx]
            const dim0 = matrix[slot][0]
            return (
              <div key={word} className="flex flex-col items-center gap-1">
                <span
                  className="rounded px-2 py-1 text-xs font-semibold text-paper"
                  style={{ backgroundColor: WORD_COLORS[word] }}
                >
                  {word}
                </span>
                <div className="h-10 w-4 overflow-hidden rounded bg-[#f2efe9]">
                  <div
                    className="w-full bg-ink-faint"
                    style={{ height: `${Math.abs(dim0) * 100}%`, marginTop: `${(1 - Math.abs(dim0)) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-faint">slot {slot}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          {variant === 'none'
            ? 'With no positional encoding, shuffling the words just relabels the same set of vectors — the model can\'t tell the difference.'
            : 'Each slot always contributes a fixed position vector, so the same word gets a different final representation depending on where it lands.'}
        </p>
      </div>
    </div>
  )
}
