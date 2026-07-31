import { useMemo, useState } from 'react'

const TOKENS = ['The', 'cat', 'sat', 'on', 'the', 'mat']
const BAR_COUNT = 8

type Mode = 'rnn' | 'lstm'

// Toy contribution model: each token's influence on the current hidden state
// decays geometrically with the number of steps since it was read. RNN decays
// fast (vanishing signal); LSTM's gated cell state decays much slower. This is
// illustrative, not a real backprop simulation.
function contribution(mode: Mode, stepsAgo: number): number {
  const decay = mode === 'rnn' ? 0.45 : 0.9
  return Math.pow(decay, stepsAgo)
}

// Deterministic per-token "fingerprint" so each token nudges different bars,
// making the hidden-state strip look like it's actually blending information.
function fingerprint(tokenIndex: number): number[] {
  return Array.from({ length: BAR_COUNT }, (_, bar) => {
    const v = Math.sin(tokenIndex * 1.7 + bar * 2.3) * 0.5 + 0.5
    return v
  })
}

export default function RnnUnrollVisualizer() {
  const [step, setStep] = useState(0) // number of tokens processed so far
  const [mode, setMode] = useState<Mode>('rnn')

  const hiddenState = useMemo(() => {
    const bars = new Array(BAR_COUNT).fill(0)
    for (let t = 0; t < step; t++) {
      const stepsAgo = step - 1 - t
      const weight = contribution(mode, stepsAgo)
      const fp = fingerprint(t)
      fp.forEach((v, i) => {
        bars[i] += v * weight
      })
    }
    const max = Math.max(...bars, 1e-6)
    return bars.map((v) => v / Math.max(max, 1))
  }, [step, mode])

  const tokenContribution = (tokenIndex: number) => {
    if (tokenIndex >= step) return 0
    return contribution(mode, step - 1 - tokenIndex)
  }

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('rnn')}
            className={`px-3 py-1.5 text-sm font-semibold transition ${
              mode === 'rnn' ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            Vanilla RNN
          </button>
          <button
            type="button"
            onClick={() => setMode('lstm')}
            className={`px-3 py-1.5 text-sm font-semibold transition ${
              mode === 'lstm' ? 'bg-accent text-paper' : 'bg-[#f2efe9] text-ink-muted'
            }`}
          >
            LSTM
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="bg-[#f2efe9] px-3 py-1.5 text-sm font-medium text-ink-muted disabled:opacity-40"
          >
            ← Reset step
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOKENS.length, s + 1))}
            disabled={step === TOKENS.length}
            className="bg-accent px-3 py-1.5 text-sm font-semibold text-paper disabled:opacity-40"
          >
            Next token →
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {TOKENS.map((token, i) => (
          <div
            key={token + i}
            className={`flex-1 border px-2 py-3 text-center text-sm font-medium transition ${
              i < step
                ? 'border-accent bg-accent/10 text-ink'
                : 'border-rule bg-[#f2efe9] text-ink-faint'
            }`}
          >
            {token}
          </div>
        ))}
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Token contribution still present in hidden state
      </p>
      <div className="mb-5 flex gap-2">
        {TOKENS.map((token, i) => (
          <div key={token + i} className="flex-1">
            <div className="h-14 overflow-hidden rounded bg-[#f2efe9]">
              <div
                className="w-full bg-accent transition-all duration-300"
                style={{
                  height: `${tokenContribution(i) * 100}%`,
                  marginTop: `${(1 - tokenContribution(i)) * 100}%`,
                }}
              />
            </div>
            <p className="mt-1 text-center text-[11px] text-ink-faint">
              {Math.round(tokenContribution(i) * 100)}%
            </p>
          </div>
        ))}
      </div>

      {mode === 'lstm' && (
        <div className="mb-5 border border-accent/30 bg-accent/5 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent">
            Cell state "conveyor belt"
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink-muted">
            <span className="rounded-full bg-surface px-2 py-1 " style={{ opacity: 0.85 }}>
              forget gate
            </span>
            <span className="rounded-full bg-surface px-2 py-1 " style={{ opacity: 0.75 }}>
              input gate
            </span>
            <span className="rounded-full bg-surface px-2 py-1 " style={{ opacity: 0.65 }}>
              output gate
            </span>
            <span className="text-ink-faint sm:ml-auto">
              gated addition → old information mostly survives each step
            </span>
          </div>
        </div>
      )}

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Hidden state (updated live as you step through)
      </p>
      <div className="flex h-16 items-end gap-1 bg-[#f2efe9] p-2">
        {hiddenState.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-none bg-ink transition-all duration-300"
            style={{ height: `${Math.max(4, v * 100)}%` }}
          />
        ))}
      </div>
    </div>
  )
}
