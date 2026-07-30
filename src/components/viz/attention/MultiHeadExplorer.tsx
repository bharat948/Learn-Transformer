import { useMemo, useState } from 'react'

import { attention } from '../../../data/artifacts'

const HEAD_COLORS = ['#a8422a', '#2f6b6e', '#9a7429', '#55617a', '#6d4c6e', '#3f6b3f']

function cellStyle(weight: number, color: string) {
  return { backgroundColor: color, opacity: Math.max(0.04, Math.min(1, weight * 1.6)) }
}

export default function MultiHeadExplorer() {
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [layerIdx, setLayerIdx] = useState(0)
  const [focusHead, setFocusHead] = useState<number | null>(null)

  const sentence = attention.sentences[sentenceIdx]
  const heads = sentence.layers[layerIdx]

  // For each head, which key token gets the most attention overall? A quick way
  // to show that heads specialize rather than duplicating each other.
  const headSummaries = useMemo(
    () =>
      heads.map((matrix) => {
        const colTotals = sentence.tokens.map((_, keyIdx) =>
          matrix.reduce((sum, row) => sum + row[keyIdx], 0),
        )
        const best = colTotals.indexOf(Math.max(...colTotals))
        return { token: sentence.tokens[best], share: colTotals[best] / sentence.tokens.length }
      }),
    [heads, sentence.tokens],
  )

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {attention.sentences.map((s, i) => (
          <button
            key={s.text}
            type="button"
            onClick={() => {
              setSentenceIdx(i)
              setFocusHead(null)
            }}
            className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
              i === sentenceIdx ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {s.predicted}
          </button>
        ))}
        <span className="ml-auto flex gap-1">
          {Array.from({ length: attention.numLayers }, (_, l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLayerIdx(l)}
              className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
                l === layerIdx ? 'bg-accent text-paper' : 'bg-[#f2efe9] text-ink-muted'
              }`}
            >
              Layer {l}
            </button>
          ))}
        </span>
      </div>

      <p className="mb-4 bg-[#f2efe9] px-3 py-2 text-sm text-ink-muted">
        “{sentence.text}” → predicted{' '}
        <strong className="text-ink">{sentence.predicted}</strong> at{' '}
        {(Math.max(...Object.values(sentence.probabilities)) * 100).toFixed(1)}% confidence
        {sentence.unknownTokens.length > 0 && (
          <span className="ml-1 text-accent">
            (“{sentence.unknownTokens.join('”, “')}” was out of vocabulary → &lt;unk&gt;)
          </span>
        )}
      </p>

      <div className={`grid gap-4 ${focusHead === null ? 'sm:grid-cols-2' : ''}`}>
        {heads.map((matrix, headIdx) => {
          if (focusHead !== null && focusHead !== headIdx) return null
          const color = HEAD_COLORS[headIdx % HEAD_COLORS.length]
          return (
            <div key={headIdx} className="border border-rule p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color }}>
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  Head {headIdx}
                </span>
                <button
                  type="button"
                  onClick={() => setFocusHead(focusHead === headIdx ? null : headIdx)}
                  className="text-[11px] font-medium text-ink-faint hover:text-accent"
                >
                  {focusHead === headIdx ? 'show all' : 'focus'}
                </button>
              </div>

              <div
                className="grid gap-[1px]"
                style={{
                  gridTemplateColumns: `minmax(48px, auto) repeat(${sentence.tokens.length}, 1fr)`,
                }}
              >
                <div />
                {sentence.tokens.map((t, i) => (
                  <div key={i} className="pb-1 text-center text-[8px] text-ink-faint">
                    {t.slice(0, 4)}
                  </div>
                ))}
                {sentence.tokens.map((rowToken, r) => (
                  <div key={r} className="contents">
                    <div className="pr-1 text-right text-[9px] text-ink-faint">{rowToken}</div>
                    {matrix[r].map((w, c) => (
                      <div
                        key={c}
                        className="aspect-square rounded-[2px]"
                        style={cellStyle(w, color)}
                        title={`${rowToken} → ${sentence.tokens[c]}: ${w.toFixed(3)}`}
                      />
                    ))}
                  </div>
                ))}
              </div>

              <p className="mt-2 text-[11px] text-ink-faint">
                Attends most to <strong>“{headSummaries[headIdx].token}”</strong>
              </p>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Real attention weights from <code>ablation_pe_sinusoidal.pt</code> — {attention.numLayers}{' '}
        layers × {attention.numHeads} heads, captured with{' '}
        <code>model(token_ids, return_attention=True)</code>. Each head learned a different
        pattern; none of these numbers are hand-authored.
      </p>
    </div>
  )
}
