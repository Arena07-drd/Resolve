import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import TicketTable from '../components/TicketTable.jsx'
import { getApiErrorMessage } from '../services/api.js'
import { getTickets } from '../services/ticketService.js'
import { getUsers } from '../services/userService.js'

function DashboardPage() {
  const [data, setData] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        // Fall back gracefully
      })
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      const response = await getTickets({ page: 1, limit: 5 })
      setData(response)
      setError('')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(loadDashboard, 0)
    return () => window.clearTimeout(timerId)
  }, [loadDashboard])

  return (
    <section>
      <div className="page-heading">
        <div><h1>Dashboard</h1><p>Your five newest support tickets.</p></div>
        <Link className="button-link" to="/tickets/new">Create ticket</Link>
      </div>
      <ErrorMessage message={error} />
      {!data && !error && <LoadingMessage />}
      {data && (
        <>
          <p>Total tickets: {data.pagination.total}</p>
          <TicketTable tickets={data.tickets} users={users} />
          <p><Link to="/tickets">View all tickets</Link></p>
        </>
      )}
    </section>
  )
}

export default DashboardPage
