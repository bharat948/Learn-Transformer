import { useState } from 'react'

import { ablation, baselines } from '../../../data/artifacts'
import { ACCENT, INK_MUTED, PAPER, ramp, SECONDARY } from '../../../lib/viz'

type View = 'baselines' | 'ablation' | 'confusion'

const BAR_COLOR: Record<string, string> = {
  Transformer: '#a8422a',
  AvgEmbedding: '#726d64',
  BiLSTM: '#2f6b6e',
  TextCNN: '#9a7429',
}

const PE_COLOR: Record<string, string> = {
  none: '#726d64',
  sinusoidal: '#a8422a',
  learned: '#2f6b6e',
}

export default function ModelComparison() {
  const [view, setView] = useState<View>('baselines')
  const [pe, setPe] = useState('sinusoidal')

  const baselineRows = Object.entries(baselines)
  const maxAcc = Math.max(...baselineRows.map(([, r]) => r.testAcc))

  const ablationRows = Object.entries(ablation.results)
  const matrix = ablation.confusionMatrices[pe]
  const classNames = ablation.classNames

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap gap-1">
        {(
          [
            ['baselines', 'vs. baselines'],
            ['ablation', 'PE ablation'],
            ['confusion', 'Confusion matrix'],
          ] as [View, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
              view === key ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'baselines' && (
        <>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-faint">
                <th className="pb-2 font-medium">model</th>
                <th className="pb-2 font-medium">test acc</th>
                <th className="pb-2 font-medium">macro F1</th>
                <th className="pb-2 font-medium">params</th>
                <th className="pb-2 font-medium">train time</th>
              </tr>
            </thead>
            <tbody>
              {baselineRows.map(([name, row]) => (
                <tr key={name} className="border-t border-rule">
                  <td className="py-2 font-medium" style={{ color: BAR_COLOR[name] }}>
                    {name}
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded bg-[#f2efe9]">
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${(row.testAcc / maxAcc) * 100}%`,
                            backgroundColor: BAR_COLOR[name] ?? '#726d64',
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-ink-muted">
                        {(row.testAcc * 100).toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2 font-mono text-xs text-ink-faint">
                    {row.macroF1 ? row.macroF1.toFixed(3) : '—'}
                  </td>
                  <td className="py-2 font-mono text-xs text-ink-faint">
                    {(row.numParams / 1e6).toFixed(2)}M
                  </td>
                  <td className="py-2 font-mono text-xs text-ink-faint">
                    {(row.trainTimeSec / 60).toFixed(1)}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 mt-4 max-w-measure font-serif text-[0.9375rem] leading-relaxed text-ink-muted">
            All models share the same embedding dimension, dropout, optimizer, and schedule, so
            the comparison isolates architecture rather than tuning. Notice how close{' '}
            <strong>AvgEmbedding</strong> — which does no sequence modeling at all — gets. Topic
            classification is largely a bag-of-words task, which is exactly why it is a fair but
            unflattering benchmark for attention.
          </p>
        </>
      )}

      {view === 'ablation' && (
        <>
          <div className="flex items-end gap-6">
            {ablationRows.map(([variant, row]) => (
              <div key={variant} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-mono text-xs text-ink-muted">
                  {(row.test_acc * 100).toFixed(2)}%
                </span>
                <div className="flex h-32 w-full items-end">
                  <div
                    className="w-full rounded-none transition-all"
                    style={{
                      // Zoom into the 86-90% band; a 0-100% axis would make these
                      // bars visually identical and hide the real (small) differences.
                      height: `${((row.test_acc - 0.86) / 0.04) * 100}%`,
                      backgroundColor: PE_COLOR[variant],
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-ink-muted">{variant}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink-faint">y-axis zoomed to 86–90%</p>
          <p className="mt-2 mt-4 max-w-measure border-l-2 border-accent pl-4 font-serif text-[0.9375rem] leading-relaxed text-ink-body">
            <strong>The honest result:</strong> removing positional encoding entirely costs only{' '}
            {((ablation.results.learned.test_acc - ablation.results.none.test_acc) * 100).toFixed(2)}{' '}
            percentage points. That is not a bug — for 4-way topic classification, word order barely
            matters, since “stocks” and “rally” signal Business in any order. Position information
            earns its keep on tasks where order changes meaning (translation, generation, NLI), not
            here. Sinusoidal vs. learned differ by even less, matching the original paper’s finding
            that the two are “nearly identical.”
          </p>
        </>
      )}

      {view === 'confusion' && matrix && (
        <>
          <div className="mb-3 flex gap-1">
            {Object.keys(ablation.results).map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => setPe(variant)}
                className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
                  pe === variant ? 'bg-accent text-paper' : 'bg-[#f2efe9] text-ink-muted'
                }`}
              >
                {variant}
              </button>
            ))}
          </div>
          <div
            className="grid gap-1 text-xs"
            style={{ gridTemplateColumns: `72px repeat(${classNames.length}, 1fr)` }}
          >
            <div />
            {classNames.map((c) => (
              <div key={c} className="pb-1 text-center text-[10px] font-medium text-ink-faint">
                {c}
              </div>
            ))}
            {matrix.map((row, r) => {
              const rowTotal = row.reduce((a, b) => a + b, 0)
              return (
                <div key={r} className="contents">
                  <div className="flex items-center justify-end pr-1 text-[10px] font-medium text-ink-faint">
                    {classNames[r]}
                  </div>
                  {row.map((count, c) => (
                    <div
                      key={c}
                      className="flex aspect-square items-center justify-center font-mono text-[10px] tabular"
                      style={{
                        // Diagonal (correct) reads slate; off-diagonal (errors) reads rust,
                        // so mistakes are the warm, eye-catching cells.
                        backgroundColor: ramp(count / rowTotal, r === c ? SECONDARY : ACCENT),
                        color: count / rowTotal > 0.55 ? PAPER : INK_MUTED,
                      }}
                      title={`true ${classNames[r]} → predicted ${classNames[c]}: ${count}`}
                    >
                      {count}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <p className="mt-3 mt-4 max-w-measure font-serif text-[0.9375rem] leading-relaxed text-ink-muted">
            Rows are the true class, columns the prediction — the teal diagonal is correct, red
            off-diagonal is error. The biggest confusion is{' '}
            <strong>Business ↔ Sci/Tech</strong>, which makes sense: a story about a tech company’s
            earnings genuinely belongs to both.
          </p>
        </>
      )}
    </div>
  )
}
