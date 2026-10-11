import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import CreateTicketPage from './pages/CreateTicketPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import TicketDetailsPage from './pages/TicketDetailsPage.jsx'
import TicketListPage from './pages/TicketListPage.jsx'

const tokenKey = 'resolveToken'
const userKey = 'resolveUser'

function getStoredUser() {
  try {
    const token = localStorage.getItem(tokenKey)
    const user = JSON.parse(localStorage.getItem(userKey))
    return token && user ? user : null
  } catch {
    return null
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser)

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    setUser(null)
  }, [])

  const saveSession = useCallback((session) => {
    localStorage.setItem(tokenKey, session.token)
    localStorage.setItem(userKey, JSON.stringify(session.user))
    setUser(session.user)
  }, [])

  useEffect(() => {
    window.addEventListener('resolve:unauthorized', logout)
    return () => window.removeEventListener('resolve:unauthorized', logout)
  }, [logout])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onAuthenticated={saveSession} />} />
      <Route path="/register" element={<RegisterPage onAuthenticated={saveSession} />} />
      <Route element={<ProtectedRoute user={user} />}>
        <Route element={<AppLayout user={user} onLogout={logout} />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<CreateTicketPage />} />
          <Route path="/tickets/:ticketId" element={<TicketDetailsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}

export default App
