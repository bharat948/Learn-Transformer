import type { ReactNode } from 'react'

import { useProgress } from '../../lib/progress'

interface MilestoneCardProps {
  lessonId: string
  milestoneId: string
  title: string
  children?: ReactNode
  /** Auto-ticked milestones (e.g. by a CodeSandbox) are not manually checkable. */
  auto?: boolean
}

export default function MilestoneCard({
  lessonId,
  milestoneId,
  title,
  children,
  auto = false,
}: MilestoneCardProps) {
  const { isMilestoneDone, setMilestone } = useProgress()
  const done = isMilestoneDone(lessonId, milestoneId)

  return (
    <div className="not-prose my-8 flex items-start gap-4 border-y border-rule py-4">
      <span
        className={`mt-1 font-mono text-[0.6875rem] ${done ? 'text-accent' : 'text-ink-faint'}`}
        aria-hidden
      >
        {done ? '●' : '○'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="label mb-1">{done ? 'Milestone complete' : 'Milestone'}</p>
        <p className="font-sans text-[0.9375rem] font-medium text-ink">{title}</p>
        {children && (
          <div className="mt-1 font-serif text-[1rem] leading-relaxed text-ink-muted">
            {children}
          </div>
        )}
      </div>

      {!auto && (
        <button
          type="button"
          onClick={() => setMilestone(lessonId, milestoneId, !done)}
          className={`mt-0.5 shrink-0 font-sans text-[0.75rem] font-medium transition ${
            done ? 'text-accent' : 'text-ink-faint hover:text-accent'
          }`}
        >
          {done ? 'Done' : 'Mark done'}
        </button>
      )}
    </div>
  )
}
