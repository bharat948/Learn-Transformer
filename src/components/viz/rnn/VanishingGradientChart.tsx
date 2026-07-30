// Illustrative gradient-magnitude decay curves (not derived from a real backward
// pass) — RNN gradients shrink fast as distance grows, LSTM's gating keeps more
// signal alive over the same distance.
const RNN_GRADIENT = [1, 0.55, 0.28, 0.13, 0.06, 0.02]
const LSTM_GRADIENT = [1, 0.92, 0.83, 0.74, 0.65, 0.55]

export default function VanishingGradientChart() {
  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <p className="mb-1 text-sm font-semibold text-ink">
        Gradient magnitude vs. distance from the output
      </p>
      <p className="mb-4 text-xs text-ink-faint">
        Illustrative, not measured from a real backward pass — the shape is what matters.
      </p>
      <div className="flex items-end gap-4">
        {RNN_GRADIENT.map((rnnVal, i) => {
          const lstmVal = LSTM_GRADIENT[i]
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-40 w-full items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-none bg-ink transition-all"
                  style={{ height: `${rnnVal * 100}%` }}
                  title={`RNN: ${rnnVal}`}
                />
                <div
                  className="w-1/2 rounded-none bg-accent transition-all"
                  style={{ height: `${lstmVal * 100}%` }}
                  title={`LSTM: ${lstmVal}`}
                />
              </div>
              <span className="text-[11px] text-ink-faint">t-{i}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-ink-faint">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink" /> Vanilla RNN
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> LSTM
        </span>
      </div>
    </div>
  )
}
