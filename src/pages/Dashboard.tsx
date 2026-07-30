import { Link } from 'react-router-dom'

import { ablation, baselines, modelMeta } from '../data/artifacts'
import { exercises } from '../data/exercises'
import { KIND_LABEL, lessons, totalMilestones } from '../data/lessons'
import { useProgress } from '../lib/progress'

export default function Dashboard() {
  const { isComplete, countMilestonesDone, getCode, resetAll } = useProgress()

  const lessonsDone = lessons.filter((l) => isComplete(l.id)).length
  const milestonesDone = lessons.reduce(
    (sum, l) => sum + countMilestonesDone(l.id, l.milestones.map((m) => m.id)),
    0,
  )
  const exerciseList = Object.values(exercises)
  const started = (id: string, starter: string) => {
    const saved = getCode(id)
    return saved !== undefined && saved.trim() !== starter.trim()
  }
  const exercisesStarted = exerciseList.filter((ex) => started(ex.id, ex.starterCode)).length
  const nextLesson = lessons.find((l) => !isComplete(l.id))

  return (
    <div>
      <header className="mb-12">
        <p className="label mb-3">Lab dashboard</p>
        <h1 className="text-[2.125rem] font-semibold leading-[1.15] text-ink">Your workspace</h1>
      </header>

      <dl className="mb-12 flex flex-wrap gap-x-14 gap-y-6 border-y border-rule-strong py-6">
        {[
          ['Lessons complete', `${lessonsDone}/${lessons.length}`],
          ['Milestones hit', `${milestonesDone}/${totalMilestones}`],
          ['Exercises started', `${exercisesStarted}/${exerciseList.length}`],
        ].map(([label, value]) => (
          <div key={label}>
            <dd className="font-mono text-[1.75rem] tabular leading-none text-ink">{value}</dd>
            <dt className="label mt-2">{label}</dt>
          </div>
        ))}
      </dl>

      {nextLesson && (
        <p className="mb-12 font-serif text-prose-sm italic text-ink-muted">
          Pick up where you left off:{' '}
          <Link to={`/lesson/${nextLesson.slug}`} className="not-italic text-accent">
            Lesson {nextLesson.order} — {nextLesson.title}
          </Link>
        </p>
      )}

      <section className="mb-14">
        <h2 className="label mb-3">Milestones</h2>
        <ul className="border-t border-rule">
          {lessons.map((lesson) => {
            const done = countMilestonesDone(
              lesson.id,
              lesson.milestones.map((m) => m.id),
            )
            return (
              <li key={lesson.id} className="border-b border-rule">
                <Link to={`/lesson/${lesson.slug}`} className="group flex items-center gap-4 py-3">
                  <span className="w-4 shrink-0 font-mono text-[0.75rem] tabular text-ink-faint">
                    {lesson.order}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[0.875rem] text-ink-body group-hover:text-accent">
                    {lesson.title}
                  </span>
                  <span className="hidden shrink-0 font-sans text-[0.6875rem] text-ink-faint sm:block">
                    {KIND_LABEL[lesson.kind]}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {lesson.milestones.map((m) => (
                      <span
                        key={m.id}
                        title={m.title}
                        className={`font-mono text-[0.5625rem] ${
                          countMilestonesDone(lesson.id, [m.id]) === 1
                            ? 'text-accent'
                            : 'text-rule-strong'
                        }`}
                      >
                        ●
                      </span>
                    ))}
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-[0.6875rem] tabular text-ink-faint">
                    {done}/{lesson.milestones.length}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mb-14">
        <h2 className="label mb-3">The model behind this course</h2>
        <p className="mb-5 max-w-measure font-serif text-[1rem] leading-relaxed text-ink-muted">
          Every attention map, training curve, and ablation figure in these lessons was exported
          from this checkpoint by <code className="font-mono text-[0.875em]">scripts/export_web_artifacts.py</code>.
          Retrain the model and the visualizations follow.
        </p>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-y border-rule py-5 sm:grid-cols-4">
          {[
            ['d_model', modelMeta.config.d_model],
            ['heads', modelMeta.config.num_heads],
            ['layers', modelMeta.config.num_layers],
            ['d_ff', modelMeta.config.d_ff],
            ['vocab', modelMeta.vocabSize.toLocaleString()],
            ['params', `${(modelMeta.numParams / 1e6).toFixed(2)}M`],
            ['test acc', `${(modelMeta.testAcc * 100).toFixed(2)}%`],
            ['classes', modelMeta.classNames.length],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="label">{label}</dt>
              <dd className="mt-1 font-mono text-[0.9375rem] tabular text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 font-mono text-[0.6875rem] leading-relaxed text-ink-faint">
          {modelMeta.sourceCheckpoint} · baselines: {Object.keys(baselines).join(', ')} · PE
          variants: {Object.keys(ablation.results).join(', ')}
        </p>
      </section>

      <section className="mb-14">
        <h2 className="label mb-3">Your saved code</h2>
        <ul className="border-t border-rule">
          {exerciseList.map((ex) => {
            const isStarted = started(ex.id, ex.starterCode)
            return (
              <li key={ex.id} className="flex items-center gap-4 border-b border-rule py-3">
                <span
                  className={`shrink-0 font-mono text-[0.5625rem] ${
                    isStarted ? 'text-accent' : 'text-rule-strong'
                  }`}
                >
                  ●
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-[0.875rem] text-ink-body">
                  {ex.title}
                </span>
                {ex.repoRef && (
                  <code className="hidden shrink-0 font-mono text-[0.6875rem] text-ink-faint sm:block">
                    {ex.repoRef}
                  </code>
                )}
                <span className="w-16 shrink-0 text-right font-sans text-[0.6875rem] text-ink-faint">
                  {isStarted ? 'edited' : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <button
        type="button"
        onClick={() => {
          if (confirm('Reset all progress, milestones, and saved code? This cannot be undone.')) {
            resetAll()
          }
        }}
        className="font-sans text-[0.75rem] text-ink-faint transition hover:text-accent"
      >
        Reset all progress
      </button>
    </div>
  )
}
