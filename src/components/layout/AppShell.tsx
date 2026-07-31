import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import Sidebar from './Sidebar'

const DESKTOP_QUERY = '(min-width: 1024px)'
const COLLAPSE_KEY = 'mini-transformer-sidebar-collapsed'

function isDesktopNow() {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [isDesktop, setIsDesktop] = useState(isDesktopNow)
  const [open, setOpen] = useState(() => {
    // Desktop remembers the last choice; mobile always starts closed so the
    // drawer never covers content on arrival.
    if (!isDesktopNow()) return false
    return localStorage.getItem(COLLAPSE_KEY) === 'false'
  })

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
      setOpen(event.matches ? localStorage.getItem(COLLAPSE_KEY) === 'false' : false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (isDesktop) localStorage.setItem(COLLAPSE_KEY, String(!open))
  }, [open, isDesktop])

  // Navigating from the drawer should dismiss it, or the new page stays hidden.
  useEffect(() => {
    if (!isDesktop) setOpen(false)
  }, [location.pathname, isDesktop])

  useEffect(() => {
    if (isDesktop || !open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktop, open])

  // Stop the page scrolling underneath the open drawer.
  useEffect(() => {
    if (isDesktop || !open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isDesktop, open])

  return (
    <div className="min-h-screen bg-paper">
      {/* Mobile chrome. Hidden on desktop so the editorial layout stays uncluttered. */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-rule bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open curriculum menu"
          aria-expanded={open}
          className="-ml-1 rounded p-1.5 text-ink transition hover:bg-rule/50"
        >
          <MenuIcon />
        </button>
        <Link to="/" className="font-sans text-[0.875rem] font-semibold text-ink">
          Transformers, Hands-On
        </Link>
      </header>

      {!isDesktop && open && (
        <div
          className="fixed inset-0 z-40 bg-ink/25 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex">
        <Sidebar open={open} isDesktop={isDesktop} onClose={() => setOpen(false)} />

        <main className="min-w-0 flex-1">
          {isDesktop && !open && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Show curriculum menu"
              className="fixed left-4 top-5 z-30 rounded border border-rule bg-paper p-2 text-ink-muted transition hover:border-rule-strong hover:text-ink"
            >
              <MenuIcon />
            </button>
          )}

          <div className="mx-auto max-w-reading px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
