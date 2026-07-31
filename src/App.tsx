import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppShell from './components/layout/AppShell'
import { ProgressProvider } from './lib/progress'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import LessonPage from './pages/LessonPage'

export default function App() {
  return (
    <ProgressProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/course" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/lesson/:slug" element={<LessonPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ProgressProvider>
  )
}
