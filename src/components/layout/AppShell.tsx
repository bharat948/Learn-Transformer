import type { ReactNode } from 'react'

import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-reading px-8 py-16 sm:px-12">{children}</div>
      </main>
    </div>
  )
}
