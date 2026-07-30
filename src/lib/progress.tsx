import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'mini-transformer-progress'

interface ProgressState {
  /** lessonId -> marked complete */
  lessons: Record<string, boolean>
  /** "lessonId:milestoneId" -> achieved */
  milestones: Record<string, boolean>
  /** exerciseId -> the learner's saved code */
  code: Record<string, string>
}

const EMPTY: ProgressState = { lessons: {}, milestones: {}, code: {} }

function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as unknown

    if (!parsed || typeof parsed !== 'object') return EMPTY

    // v1 stored a flat { lessonId: true } map. Migrate it rather than dropping
    // progress for anyone who used the earlier build.
    if (!('lessons' in (parsed as Record<string, unknown>))) {
      return { ...EMPTY, lessons: parsed as Record<string, boolean> }
    }

    const state = parsed as Partial<ProgressState>
    return {
      lessons: state.lessons ?? {},
      milestones: state.milestones ?? {},
      code: state.code ?? {},
    }
  } catch {
    return EMPTY
  }
}

interface ProgressContextValue {
  lessons: Record<string, boolean>
  milestones: Record<string, boolean>
  isComplete: (lessonId: string) => boolean
  markComplete: (lessonId: string) => void
  isMilestoneDone: (lessonId: string, milestoneId: string) => boolean
  setMilestone: (lessonId: string, milestoneId: string, done: boolean) => void
  countMilestonesDone: (lessonId: string, milestoneIds: string[]) => number
  getCode: (exerciseId: string) => string | undefined
  saveCode: (exerciseId: string, code: string) => void
  resetAll: () => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

const milestoneKey = (lessonId: string, milestoneId: string) => `${lessonId}:${milestoneId}`

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProgressState>(() => loadProgress())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<ProgressContextValue>(
    () => ({
      lessons: state.lessons,
      milestones: state.milestones,
      isComplete: (lessonId) => Boolean(state.lessons[lessonId]),
      markComplete: (lessonId) =>
        setState((prev) => ({ ...prev, lessons: { ...prev.lessons, [lessonId]: true } })),
      isMilestoneDone: (lessonId, milestoneId) =>
        Boolean(state.milestones[milestoneKey(lessonId, milestoneId)]),
      setMilestone: (lessonId, milestoneId, done) =>
        setState((prev) => ({
          ...prev,
          milestones: { ...prev.milestones, [milestoneKey(lessonId, milestoneId)]: done },
        })),
      countMilestonesDone: (lessonId, milestoneIds) =>
        milestoneIds.filter((id) => state.milestones[milestoneKey(lessonId, id)]).length,
      getCode: (exerciseId) => state.code[exerciseId],
      saveCode: (exerciseId, code) =>
        setState((prev) => ({ ...prev, code: { ...prev.code, [exerciseId]: code } })),
      resetAll: () => setState(EMPTY),
    }),
    [state],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
