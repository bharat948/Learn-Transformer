import { useMemo, useState } from 'react'

interface Token {
  label: string
  key: [number, number]
  value: [number, number]
  color: string
}

const TOKENS: Token[] = [
  { label: 'cat', key: [2, 1], value: [1, 0], color: '#a8422a' },
  { label: 'dog', key: [2, -1], value: [0, 1], color: '#2f6b6e' },
  { label: 'ran', key: [-1, 2], value: [1, 1], color: '#9a7429' },
  { label: 'fast', key: [-1, -2], value: [0, 0.4], color: '#55617a' },
]

const D_K = 2
const SCALE = Math.sqrt(D_K)

function softmax(values: number[]): number[] {
  const max = Math.max(...values)
  const exps = values.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

// Map a small [-3, 3] logical coordinate to a 200x200 SVG viewport.
const toSvg = (v: number, size = 200, range = 3) => size / 2 + (v / range) * (size / 2 - 20)

export default function QKVSandbox() {
  const [qx, setQx] = useState(2)
  const [qy, setQy] = useState(1)

  const dots = useMemo(() => TOKENS.map((t) => qx * t.key[0] + qy * t.key[1]), [qx, qy])
  const scaled = dots.map((d) => d / SCALE)
  const weights = softmax(scaled)
  const output: [number, number] = [
    TOKENS.reduce((sum, t, i) => sum + weights[i] * t.value[0], 0),
    TOKENS.reduce((sum, t, i) => sum + weights[i] * t.value[1], 0),
  ]

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Move the query</p>
          <div className="mb-3 flex flex-col gap-2 text-xs text-ink-faint">
            <label className="flex items-center gap-2">
              q<sub>x</sub>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={qx}
                onChange={(e) => setQx(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="w-10 text-right">{qx.toFixed(1)}</span>
            </label>
            <label className="flex items-center gap-2">
              q<sub>y</sub>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={qy}
                onChange={(e) => setQy(Number(e.target.value))}
                className="flex-1 accent-accent"
              />
              <span className="w-10 text-right">{qy.toFixed(1)}</span>
            </label>
          </div>

          <svg viewBox="0 0 200 200" className="w-full bg-[#f2efe9]">
            <line x1={0} y1={100} x2={200} y2={100} stroke="#e4e0d9" />
            <line x1={100} y1={0} x2={100} y2={200} stroke="#e4e0d9" />
            {TOKENS.map((t) => (
              <g key={t.label}>
                <line
                  x1={100}
                  y1={100}
                  x2={toSvg(t.key[0])}
                  y2={200 - toSvg(t.key[1])}
                  stroke={t.color}
                  strokeWidth={1}
                  opacity={0.35}
                />
                <circle cx={toSvg(t.key[0])} cy={200 - toSvg(t.key[1])} r={5} fill={t.color} />
                <text
                  x={toSvg(t.key[0]) + 7}
                  y={200 - toSvg(t.key[1]) + 3}
                  fontSize={9}
                  fill="#5c5852"
                >
                  {t.label} (key)
                </text>
              </g>
            ))}
            <line
              x1={100}
              y1={100}
              x2={toSvg(qx)}
              y2={200 - toSvg(qy)}
              stroke="#1c1b19"
              strokeWidth={2}
            />
            <circle cx={toSvg(qx)} cy={200 - toSvg(qy)} r={6} fill="#1c1b19" />
            <text x={toSvg(qx) + 8} y={200 - toSvg(qy) - 6} fontSize={10} fontWeight={600} fill="#1c1b19">
              query
            </text>
          </svg>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Live attention computation</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-ink-faint">
                <th className="pb-1 font-medium">token</th>
                <th className="pb-1 font-medium">q·k</th>
                <th className="pb-1 font-medium">/√d_k</th>
                <th className="pb-1 font-medium">softmax</th>
              </tr>
            </thead>
            <tbody>
              {TOKENS.map((t, i) => (
                <tr key={t.label} className="border-t border-rule">
                  <td className="py-1.5 font-medium" style={{ color: t.color }}>
                    {t.label}
                  </td>
                  <td className="py-1.5 text-ink-muted">{dots[i].toFixed(2)}</td>
                  <td className="py-1.5 text-ink-muted">{scaled[i].toFixed(2)}</td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded bg-[#f2efe9]">
                        <div
                          className="h-full rounded bg-accent"
                          style={{ width: `${weights[i] * 100}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-ink-faint">
                        {(weights[i] * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 bg-accent/5 p-3 text-xs text-ink-muted">
            <p className="font-semibold text-accent">
              Output = Σ (weight × value) = [{output[0].toFixed(2)}, {output[1].toFixed(2)}]
            </p>
            <p className="mt-1">
              Nudge the query toward a token's key and watch its weight — and its share of the
              output vector — grow.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
