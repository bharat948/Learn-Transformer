import { useState } from 'react'

/** A tiny 4-dim vector walked through one encoder block, computed live in TS. */
const INPUT = [1.2, -0.4, 0.8, -1.6]
const ATTN_OUT = [0.5, 0.3, -0.2, 0.4]
const FFN_HIDDEN_W = [1, -1, 0.5, 2]

function layerNorm(vec: number[], eps = 1e-5) {
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length
  const variance = vec.reduce((a, b) => a + (b - mean) ** 2, 0) / vec.length
  const denom = Math.sqrt(variance + eps)
  return vec.map((v) => (v - mean) / denom)
}

const afterResidual1 = INPUT.map((v, i) => v + ATTN_OUT[i])
const afterNorm1 = layerNorm(afterResidual1)
const ffnOut = afterNorm1.map((v, i) => Math.max(0, v * FFN_HIDDEN_W[i]) * 0.6)
const afterResidual2 = afterNorm1.map((v, i) => v + ffnOut[i])
const afterNorm2 = layerNorm(afterResidual2)

interface Step {
  label: string
  detail: string
  vector: number[]
  residual?: boolean
  repo: string
}

const STEPS: Step[] = [
  {
    label: 'Input',
    detail: 'The token vector arriving from the embedding + positional encoding (or the layer below).',
    vector: INPUT,
    repo: 'EncoderLayer.forward(x, mask)',
  },
  {
    label: 'Self-attention',
    detail: 'Every token mixes in information from every other token. This is the only place tokens talk to each other.',
    vector: ATTN_OUT,
    repo: 'self.self_attn(x, x, x, mask=mask)',
  },
  {
    label: 'Add (residual)',
    detail: 'Add the original input back. The block only has to learn a correction, and gradients get a direct path backwards.',
    vector: afterResidual1,
    residual: true,
    repo: 'x + self.dropout(sublayer_out)',
  },
  {
    label: '& Norm',
    detail: 'LayerNorm rescales to zero mean and unit variance, keeping activations stable as layers stack.',
    vector: afterNorm1,
    repo: 'self.attn_add_norm(x, attn_out)',
  },
  {
    label: 'Feed-forward',
    detail: 'Linear → ReLU → Linear, applied to each position independently. No mixing across tokens happens here.',
    vector: ffnOut,
    repo: 'self.feed_forward(x)',
  },
  {
    label: 'Add (residual)',
    detail: 'Second residual — note it adds the post-attention vector, not the block’s original input.',
    vector: afterResidual2,
    residual: true,
    repo: 'x + self.dropout(ffn_out)',
  },
  {
    label: '& Norm',
    detail: 'Normalize again. This is the block output, ready for the next encoder layer.',
    vector: afterNorm2,
    repo: 'self.ffn_add_norm(x, ffn_out)',
  },
]

export default function EncoderBlockFlow() {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const max = Math.max(...STEPS.flatMap((s) => s.vector.map(Math.abs)))

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s.label + i}
            type="button"
            onClick={() => setStep(i)}
            className={`px-2.5 py-1.5 text-xs font-semibold transition ${
              i === step
                ? s.residual
                  ? 'bg-accent text-paper'
                  : 'bg-ink text-paper'
                : i < step
                  ? 'bg-rule-strong text-ink-muted'
                  : 'bg-[#f2efe9] text-ink-faint'
            }`}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-end gap-2 bg-[#f2efe9] p-4">
        {current.vector.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-24 w-full items-center">
              <div className="relative h-full w-full">
                <div className="absolute inset-x-0 top-1/2 h-px bg-rule-strong" />
                <div
                  className={`absolute inset-x-0 rounded transition-all duration-300 ${
                    current.residual ? 'bg-accent' : 'bg-accent'
                  }`}
                  style={{
                    height: `${(Math.abs(v) / max) * 48}%`,
                    top: v >= 0 ? `${50 - (Math.abs(v) / max) * 48}%` : '50%',
                  }}
                />
              </div>
            </div>
            <span className="font-mono text-[10px] text-ink-faint">{v.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-l-4 border-accent bg-accent/5 p-3">
        <p className="mb-1 text-sm font-semibold text-ink">
          {step + 1}. {current.label}
        </p>
        <p className="text-sm text-ink-muted">{current.detail}</p>
        <code className="mt-2 block rounded bg-surface px-2 py-1 text-[11px] text-ink-faint">
          {current.repo}
        </code>
      </div>

      <div className="mt-3 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="bg-[#f2efe9] px-3 py-1.5 text-sm font-medium text-ink-muted disabled:opacity-40"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          className="bg-accent px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-40"
        >
          Next step →
        </button>
      </div>
    </div>
  )
}
