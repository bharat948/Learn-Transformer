import { useState } from 'react'

import { baselines, type EpochRecord } from '../../../data/artifacts'

type Metric = 'loss' | 'acc'

const SERIES = [
  { key: 'train', label: 'train', color: '#a8422a' },
  { key: 'val', label: 'validation', color: '#2f6b6e' },
] as const

export default function TrainingCurve() {
  const [metric, setMetric] = useState<Metric>('loss')
  const history = (baselines.Transformer?.history ?? []) as EpochRecord[]

  if (history.length === 0) {
    return (
      <p className="not-prose my-6 rounded-none border-l-2 border-accent pl-4 font-serif text-[0.9375rem] text-ink-body">
        No training history found — run <code>python scripts/export_web_artifacts.py</code>.
      </p>
    )
  }

  const values = history.flatMap((e) =>
    metric === 'loss' ? [e.train_loss, e.val_loss] : [e.train_acc, e.val_acc],
  )
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.15 || 0.05
  const lo = min - pad
  const hi = max + pad

  const W = 320
  const H = 150
  const x = (i: number) => (i / Math.max(history.length - 1, 1)) * (W - 40) + 32
  const y = (v: number) => H - 24 - ((v - lo) / (hi - lo)) * (H - 44)

  const path = (pick: (e: EpochRecord) => number) =>
    history.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(pick(e))}`).join(' ')

  const pickFor = (seriesKey: 'train' | 'val') => (e: EpochRecord) =>
    metric === 'loss'
      ? seriesKey === 'train'
        ? e.train_loss
        : e.val_loss
      : seriesKey === 'train'
        ? e.train_acc
        : e.val_acc

  const last = history[history.length - 1]
  const best = history.reduce((a, b) => (b.val_acc > a.val_acc ? b : a))
  const overfitting = best.epoch < last.epoch

  return (
    <div className="not-prose my-6 border-y border-rule py-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Real training run — {history.length} epochs</p>
        <div className="flex gap-1">
          {(['loss', 'acc'] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              className={`border px-3 py-1 font-sans text-[0.6875rem] font-medium transition ${
                metric === m ? 'bg-ink text-paper' : 'bg-[#f2efe9] text-ink-muted'
              }`}
            >
              {m === 'loss' ? 'Loss' : 'Accuracy'}
            </button>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1={32} y1={H - 24} x2={W - 8} y2={H - 24} stroke="#e4e0d9" />
        <line x1={32} y1={12} x2={32} y2={H - 24} stroke="#e4e0d9" />
        <text x={2} y={y(hi - pad) + 3} fontSize={8} fill="#726d64">
          {(hi - pad).toFixed(2)}
        </text>
        <text x={2} y={y(lo + pad) + 3} fontSize={8} fill="#726d64">
          {(lo + pad).toFixed(2)}
        </text>

        {/* Mark the best-validation epoch — the checkpoint train.py actually keeps. */}
        <line
          x1={x(best.epoch - 1)}
          y1={12}
          x2={x(best.epoch - 1)}
          y2={H - 24}
          stroke="#2f6b6e"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={x(best.epoch - 1)} y={9} fontSize={7} fill="#2f6b6e" textAnchor="middle">
          best
        </text>

        {SERIES.map((s) => (
          <g key={s.key}>
            <path d={path(pickFor(s.key))} fill="none" stroke={s.color} strokeWidth={2} />
            {history.map((e, i) => (
              <circle key={i} cx={x(i)} cy={y(pickFor(s.key)(e))} r={2.5} fill={s.color} />
            ))}
          </g>
        ))}

        {history.map((e, i) => (
          <text key={i} x={x(i)} y={H - 10} fontSize={8} fill="#726d64" textAnchor="middle">
            {e.epoch}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-faint">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <p className="mt-3 mt-4 max-w-measure font-serif text-[0.9375rem] leading-relaxed text-ink-muted">
        {overfitting ? (
          <>
            <strong>This run overfit.</strong> Validation accuracy peaked at{' '}
            {(best.val_acc * 100).toFixed(2)}% on epoch {best.epoch}, then <em>fell</em> to{' '}
            {(last.val_acc * 100).toFixed(2)}% by epoch {last.epoch} — while training accuracy kept
            climbing to {(last.train_acc * 100).toFixed(2)}%. Validation loss turned upward at the
            same point ({best.val_loss.toFixed(3)} → {last.val_loss.toFixed(3)}). That widening gap
            is memorization, not learning. Because <code>train.py</code> keeps the best-by-validation
            checkpoint rather than the last one, the model shipped here is epoch {best.epoch}’s — the
            final epoch cost nothing.
          </>
        ) : (
          <>
            Best validation accuracy {(best.val_acc * 100).toFixed(2)}% on epoch {best.epoch}, and
            still improving at the end — this run had not started overfitting yet.
          </>
        )}
      </p>
    </div>
  )
}
