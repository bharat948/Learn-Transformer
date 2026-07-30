import { Link } from 'react-router-dom'

import { modelMeta } from '../data/artifacts'
import { KIND_LABEL, lessons, totalMilestones } from '../data/lessons'
import { useProgress } from '../lib/progress'

const TRACKS = [
  { from: 0, to: 1, label: 'Foundations' },
  { from: 2, to: 5, label: 'Mechanism' },
  { from: 6, to: 7, label: 'Making it work' },
  { from: 8, to: 9, label: 'Proving it' },
]

export default function Home() {
  const { isComplete, countMilestonesDone } = useProgress()

  const completedCount = lessons.filter((l) => isComplete(l.id)).length
  const milestonesDone = lessons.reduce(
    (sum, l) => sum + countMilestonesDone(l.id, l.milestones.map((m) => m.id)),
    0,
  )
  const nextLesson = lessons.find((l) => !isComplete(l.id))

  return (
    <div>
      <header className="mb-16">
        <p className="label mb-4">A hands-on course</p>
        <h1 className="max-w-measure text-[2.75rem] font-semibold leading-[1.08] text-ink">
          Understand it. See it.
          <br />
          Play with it. Build it.
        </h1>
        <p className="mt-6 max-w-measure font-serif text-prose text-ink-body">
          A guided build of the Transformer architecture — from the RNN era that preceded it
          through to a working encoder block you assemble yourself. Every lesson ends in a
          milestone, most ask you to write code that has to pass tests, and the visualizations run
          on <em>actual weights</em> from the trained model in this repository, not illustrations.
        </p>

        {nextLesson && (
          <div className="mt-8 flex items-center gap-6">
            <Link
              to={`/lesson/${nextLesson.slug}`}
              className="border border-accent bg-accent px-5 py-2 font-sans text-[0.8125rem] font-medium text-paper transition hover:bg-accent-hover"
            >
              {completedCount === 0 ? 'Begin lesson 0' : 'Continue'}
            </Link>
            <span className="font-mono text-[0.6875rem] tabular text-ink-faint">
              {completedCount}/{lessons.length} lessons · {milestonesDone}/{totalMilestones}{' '}
              milestones
            </span>
          </div>
        )}
      </header>

      <div className="border-t border-rule-strong">
        {TRACKS.map((track) => (
          <section key={track.label}>
            <p className="label mb-1 mt-8">{track.label}</p>
            <ol>
              {lessons
                .filter((l) => l.order >= track.from && l.order <= track.to)
                .map((lesson) => {
                  const done = countMilestonesDone(
                    lesson.id,
                    lesson.milestones.map((m) => m.id),
                  )
                  const complete = isComplete(lesson.id)
                  return (
                    <li key={lesson.id} className="border-b border-rule last:border-b-0">
                      <Link
                        to={`/lesson/${lesson.slug}`}
                        className="group flex items-baseline gap-5 py-4"
                      >
                        <span
                          className={`w-4 shrink-0 font-mono text-[0.75rem] tabular ${
                            complete ? 'text-accent' : 'text-ink-faint'
                          }`}
                        >
                          {complete ? '●' : lesson.order}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-sans text-[1rem] font-medium text-ink transition group-hover:text-accent">
                            {lesson.title}
                          </span>
                          <span className="mt-1 block max-w-measure font-serif text-[1rem] leading-relaxed text-ink-muted">
                            {lesson.summary}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block font-sans text-[0.6875rem] text-ink-faint">
                            {KIND_LABEL[lesson.kind]}
                          </span>
                          <span className="mt-0.5 block font-mono text-[0.6875rem] tabular text-ink-faint">
                            {done}/{lesson.milestones.length}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-12 max-w-measure border-t border-rule pt-6 font-serif text-[1rem] leading-relaxed text-ink-muted">
        Built on this repository’s from-scratch PyTorch Transformer — {modelMeta.config.d_model}
        -dimensional, {modelMeta.config.num_heads} heads, {modelMeta.config.num_layers} layers,{' '}
        {(modelMeta.numParams / 1e6).toFixed(2)}M parameters, {(modelMeta.testAcc * 100).toFixed(2)}%
        test accuracy on AG News. See the{' '}
        <Link to="/dashboard" className="text-accent">
          lab dashboard
        </Link>{' '}
        for details.
      </p>
    </div>
  )
}
