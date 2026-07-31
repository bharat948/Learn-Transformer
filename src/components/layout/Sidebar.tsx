import { NavLink } from 'react-router-dom'

import { KIND_LABEL, lessons } from '../../data/lessons'
import { useProgress } from '../../lib/progress'

const TRACK_BREAKS: Record<number, string> = {
  0: 'Foundations',
  2: 'Mechanism',
  6: 'Making it work',
  8: 'Proving it',
}

interface SidebarProps {
  open: boolean
  isDesktop: boolean
  onClose: () => void
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar({ open, isDesktop, onClose }: SidebarProps) {
  const { isComplete, countMilestonesDone } = useProgress()

  // Desktop: a static column that simply unmounts when collapsed.
  // Mobile: an off-canvas drawer that slides in over the content.
  const positioning = isDesktop
    ? open
      ? 'sticky top-0 h-screen w-[16.5rem] shrink-0'
      : 'hidden'
    : `fixed inset-y-0 left-0 z-50 w-[17rem] max-w-[85vw] shadow-xl transition-transform duration-200 ${
        open ? 'translate-x-0' : '-translate-x-full invisible'
      }`

  return (
    <nav
      className={`${positioning} flex flex-col overflow-y-auto overscroll-contain border-r border-rule bg-paper px-6 py-6 lg:py-8`}
      aria-label="Curriculum"
      aria-hidden={!open}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <NavLink to="/" className="block font-sans text-[0.9375rem] font-semibold text-ink">
          Transformers, Hands-On
        </NavLink>
        <button
          type="button"
          onClick={onClose}
          aria-label={isDesktop ? 'Collapse menu' : 'Close menu'}
          className="-mr-1 -mt-0.5 rounded p-1 text-ink-faint transition hover:bg-rule/50 hover:text-ink"
        >
          <CloseIcon />
        </button>
      </div>

      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `mb-2 block font-sans text-xs ${isActive ? 'text-accent' : 'text-ink-faint hover:text-accent'}`
        }
      >
        Lab dashboard
      </NavLink>
      <NavLink
        to="/course"
        className={({ isActive }) =>
          `mb-8 block font-sans text-xs ${isActive ? 'text-accent' : 'text-ink-faint hover:text-accent'}`
        }
      >
        Course overview
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
              {track && <p className="label mb-2 mt-6 first:mt-0">{track}</p>}
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
