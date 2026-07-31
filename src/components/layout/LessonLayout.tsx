import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

import { getAdjacentLessons, KIND_LABEL, lessons, type Lesson } from '../../data/lessons'
import { useProgress } from '../../lib/progress'

interface LessonLayoutProps {
  lesson: Lesson
  children: ReactNode
}

export default function LessonLayout({ lesson, children }: LessonLayoutProps) {
  const { isComplete, markComplete, countMilestonesDone } = useProgress()
  const { prev, next } = getAdjacentLessons(lesson.order)
  const complete = isComplete(lesson.id)

  const milestoneIds = lesson.milestones.map((m) => m.id)
  const done = countMilestonesDone(lesson.id, milestoneIds)
  const allMilestonesDone = done === lesson.milestones.length

  return (
    <article>
      <header className="mb-12">
        <p className="label mb-3">
          Lesson {lesson.order} of {lessons.length - 1} · {KIND_LABEL[lesson.kind]}
        </p>
        <h1 className="text-[1.625rem] font-semibold leading-[1.18] sm:text-[2.125rem] sm:leading-[1.15] text-ink">{lesson.title}</h1>
        <p className="mt-5 border-t border-rule pt-5 font-serif text-prose-sm italic text-ink-muted">
          By the end you can {lesson.objective.charAt(0).toLowerCase() + lesson.objective.slice(1)}
        </p>
      </header>

      <div className="prose">{children}</div>

      {/* Milestones */}
      <section className="mt-16 border-t border-rule-strong pt-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="label">Milestones</h2>
          <span className="font-mono text-[0.6875rem] tabular text-ink-faint">
            {done} / {lesson.milestones.length}
          </span>
        </div>
        <ul>
          {lesson.milestones.map((m) => {
            const isDone = countMilestonesDone(lesson.id, [m.id]) === 1
            return (
              <li
                key={m.id}
                className="flex items-baseline gap-3 border-b border-rule py-2.5 last:border-b-0"
              >
                <span
                  className={`font-mono text-[0.625rem] ${isDone ? 'text-accent' : 'text-ink-faint'}`}
                >
                  {isDone ? '●' : '○'}
                </span>
                <span
                  className={`font-sans text-[0.875rem] ${isDone ? 'text-ink-faint' : 'text-ink-body'}`}
                >
                  {m.title}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Next action */}
      <p className="mt-8 font-serif text-prose-sm italic text-ink-muted">
        {!allMilestonesDone ? (
          <>
            {lesson.milestones.length - done} milestone
            {lesson.milestones.length - done === 1 ? '' : 's'} left — they are what turn this
            lesson from reading into doing.
          </>
        ) : !complete ? (
          <>All milestones done. Mark the lesson complete to lock it in.</>
        ) : next ? (
          <>
            Done here. Continue to{' '}
            <Link to={`/lesson/${next.slug}`} className="not-italic text-accent">
              {next.title}
            </Link>
            .
          </>
        ) : (
          <>
            That is the whole curriculum. Review it on the{' '}
            <Link to="/dashboard" className="not-italic text-accent">
              lab dashboard
            </Link>
            .
          </>
        )}
      </p>

      <nav className="mt-10 flex flex-col gap-5 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="order-2 min-w-0 sm:order-1 sm:flex-1">
          {prev && (
            <Link to={`/lesson/${prev.slug}`} className="group block">
              <span className="label block">Previous</span>
              <span className="block truncate font-sans text-[0.8125rem] text-ink-muted group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => markComplete(lesson.id)}
          disabled={complete}
          className={`order-1 w-full shrink-0 border px-4 py-2.5 font-sans text-[0.8125rem] font-medium transition sm:order-2 sm:w-auto sm:py-2 ${
            complete
              ? 'cursor-default border-rule text-ink-faint'
              : 'border-accent bg-accent text-paper hover:bg-accent-hover'
          }`}
        >
          {complete ? 'Completed' : 'Mark complete'}
        </button>

        <div className="order-3 min-w-0 sm:flex-1 sm:text-right">
          {next ? (
            <Link to={`/lesson/${next.slug}`} className="group block">
              <span className="label block">Next</span>
              <span className="block truncate font-sans text-[0.8125rem] text-ink-muted group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <Link to="/dashboard" className="group block">
              <span className="label block">Next</span>
              <span className="block font-sans text-[0.8125rem] text-ink-muted group-hover:text-accent">
                Lab dashboard
              </span>
            </Link>
          )}
        </div>
      </nav>
    </article>
  )
}
