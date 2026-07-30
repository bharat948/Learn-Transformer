import { useState } from 'react'

import { attention, modelMeta } from '../../../data/artifacts'

const CLASS_COLORS: Record<string, string> = {
  World: '#a8422a',
  Sports: '#2f6b6e',
  Business: '#9a7429',
  'Sci/Tech': '#3f6b3f',
}

export default function ClassifierHeadFlow() {
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [padCount, setPadCount] = useState(2)

  const sentence = attention.sentences[sentenceIdx]
  const realTokens = sentence.tokens.length
  const total = realTokens + padCount

  const entries = Object.entries(sentence.probabilities).sort((a, b) => b[1] - a[1])

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap gap-2">
        {attention.sentences.map((s, i) => (
          <button
            key={s.text}
            type="button"
            onClick={() => setSentenceIdx(i)}
            className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
              i === sentenceIdx ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            {s.predicted}
          </button>
        ))}
      </div>

      {/* Step 1: the padded sequence */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        1. Encoder output — one vector per position
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {sentence.tokens.map((t, i) => (
          <span key={i} className="rounded bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
            {t}
          </span>
        ))}
        {Array.from({ length: padCount }, (_, i) => (
          <span
            key={`pad-${i}`}
            className="rounded bg-[#f2efe9] px-2 py-1 text-xs font-medium text-ink-faint line-through"
          >
            &lt;pad&gt;
          </span>
        ))}
      </div>
      <label className="mb-4 flex items-center gap-2 text-xs text-ink-faint">
        padding added by the batch collator
        <input
          type="range"
          min={0}
          max={6}
          value={padCount}
          onChange={(e) => setPadCount(Number(e.target.value))}
          className="flex-1 accent-accent"
        />
        <span className="w-4 text-right">{padCount}</span>
      </label>

      {/* Step 2: masked mean pool */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        2. Masked mean-pool → a single {modelMeta.config.d_model}-dim vector
      </p>
      <div className="mb-4 bg-[#f2efe9] p-3 text-sm text-ink-muted">
        Sum over <strong>{realTokens}</strong> real tokens, divide by <strong>{realTokens}</strong>{' '}
        — not by {total}. The {padCount} pad position{padCount === 1 ? '' : 's'}{' '}
        {padCount === 0 ? 'are absent here' : 'contribute nothing'}.
        <div className="mt-2 font-mono text-[11px] text-ink-faint">
          summed = Σ(hidden × mask) &nbsp;·&nbsp; pooled = summed / {realTokens}
          {padCount > 0 && (
            <span className="ml-2 text-accent">
              (dividing by {total} instead would shrink every value by{' '}
              {((1 - realTokens / total) * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Step 3: linear head -> logits -> softmax */}
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        3. Linear head → {modelMeta.classNames.length} logits → softmax
      </p>
      <div className="flex flex-col gap-1.5">
        {entries.map(([className, prob]) => (
          <div key={className} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs font-medium text-ink-muted">{className}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-[#f2efe9]">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${Math.max(prob * 100, 0.5)}%`,
                  backgroundColor: CLASS_COLORS[className] ?? '#726d64',
                }}
              />
            </div>
            <span className="w-14 text-right font-mono text-xs text-ink-faint">
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Real output from <code>{modelMeta.sourceCheckpoint}</code> ({modelMeta.numParams.toLocaleString()}{' '}
        parameters, {(modelMeta.testAcc * 100).toFixed(2)}% test accuracy). The masked-pool step is{' '}
        <code>TransformerClassifier._masked_mean_pool</code>.
      </p>
    </div>
  )
}
