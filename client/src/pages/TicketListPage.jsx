import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import TicketTable from '../components/TicketTable.jsx'
import { getApiErrorMessage } from '../services/api.js'
import { getTickets } from '../services/ticketService.js'
import { getUsers } from '../services/userService.js'

function TicketListPage() {
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priority: '',
    scope: 'all',
    page: 1,
    limit: 10,
  })
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

  const loadTickets = useCallback(async () => {
    try {
      const parameters = Object.fromEntries(
        Object.entries(filters)
          .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
          .filter(([, value]) => value !== '' && value !== undefined && value !== null),
      )
      const response = await getTickets(parameters)
      setData(response)
      setError('')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }, [filters])

  useEffect(() => {
    const timerId = window.setTimeout(loadTickets, 0)
    return () => window.clearTimeout(timerId)
  }, [loadTickets])

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value, page: 1 }))
  }

  function changePage(page) {
    setFilters((currentFilters) => ({ ...currentFilters, page }))
  }

  const pagination = data?.pagination

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Tickets</h1>
          <p>Search and manage your tickets.</p>
        </div>
        <Link className="button-link" to="/tickets/new">
          Create ticket
        </Link>
      </div>
      <div className="filters">
        <label>
          Search
          <input
            name="q"
            value={filters.q}
            onChange={updateFilter}
            placeholder="Title, description, or category"
          />
        </label>
        <label>
          View
          <select name="scope" value={filters.scope} onChange={updateFilter}>
            <option value="all">All accessible</option>
            <option value="created">Created by me</option>
            <option value="assigned">Assigned to me</option>
          </select>
        </label>
        <label>
          Status
          <select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label>
          Priority
          <select name="priority" value={filters.priority} onChange={updateFilter}>
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <ErrorMessage message={error} />
      {!data && !error && <LoadingMessage />}
      {data && (
        <>
          <TicketTable tickets={data.tickets} users={users} />
          <div className="pagination">
            <button type="button" onClick={() => changePage(pagination.page - 1)} disabled={pagination.page === 1}>Previous</button>
            <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
            <button type="button" onClick={() => changePage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>Next</button>
          </div>
        </>
      )}
    </section>
  )
}

export default TicketListPage
