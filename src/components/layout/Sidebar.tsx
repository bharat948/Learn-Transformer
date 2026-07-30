import { NavLink } from 'react-router-dom'

import { KIND_LABEL, lessons } from '../../data/lessons'
import { useProgress } from '../../lib/progress'

const TRACK_BREAKS: Record<number, string> = {
  0: 'Foundations',
  2: 'Mechanism',
  6: 'Making it work',
  8: 'Proving it',
}

export default function Sidebar() {
  const { isComplete, countMilestonesDone } = useProgress()

  return (
    <nav className="sticky top-0 flex h-screen w-[16.5rem] shrink-0 flex-col overflow-y-auto border-r border-rule bg-paper px-6 py-8">
      <NavLink to="/" className="mb-1 block font-sans text-[0.9375rem] font-semibold text-ink">
        Transformers, Hands-On
      </NavLink>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `mb-8 block font-sans text-xs ${isActive ? 'text-accent' : 'text-ink-faint hover:text-accent'}`
        }
      >
        Lab dashboard
      </NavLink>

      <ol>
        {lessons.map((lesson) => {
          const done = countMilestonesDone(
            lesson.id,
            lesson.milestones.map((m) => m.id),
          )
          const complete = isComplete(lesson.id)
          const track = TRACK_BREAKS[lesson.order]

          return (
            <li key={lesson.id}>
              {track && (
                <p className="label mb-2 mt-6 first:mt-0">{track}</p>
              )}
              <NavLink to={`/lesson/${lesson.slug}`} className="group block py-1.5">
                {({ isActive }) => (
                  <span className="flex items-baseline gap-2.5">
                    <span
                      className={`w-3 shrink-0 font-mono text-[0.6875rem] tabular ${
                        complete ? 'text-accent' : isActive ? 'text-ink' : 'text-ink-faint'
                      }`}
                    >
                      {complete ? '●' : lesson.order}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block font-sans text-[0.8125rem] leading-snug ${
                          isActive
                            ? 'font-semibold text-accent'
                            : 'text-ink-body group-hover:text-ink'
                        }`}
                      >
                        {lesson.title}
                      </span>
                      <span className="mt-0.5 block font-sans text-[0.6875rem] text-ink-faint">
                        {KIND_LABEL[lesson.kind]} · {done}/{lesson.milestones.length}
                      </span>
                    </span>
                  </span>
                )}
              </NavLink>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
