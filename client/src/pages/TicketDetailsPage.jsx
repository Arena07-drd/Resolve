import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext, useParams } from 'react-router-dom'
import ErrorMessage from '../components/ErrorMessage.jsx'
import LoadingMessage from '../components/LoadingMessage.jsx'
import TicketForm from '../components/TicketForm.jsx'
import { getApiErrorMessage } from '../services/api.js'
import { closeTicket, getTicket, updateTicket } from '../services/ticketService.js'
import { getUsers } from '../services/userService.js'

function TicketDetailsPage() {
  const { ticketId } = useParams()
  const { user } = useOutletContext()
  const [ticket, setTicket] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [isClosing, setIsClosing] = useState(false)

  const loadTicket = useCallback(async () => {
    try {
      const response = await getTicket(ticketId)
      setTicket(response)
      setError('')
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    }
  }, [ticketId])

  useEffect(() => {
    const timerId = window.setTimeout(loadTicket, 0)
    return () => window.clearTimeout(timerId)
  }, [loadTicket])

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        // Fall back gracefully if users list fails
      })
  }, [])

  async function handleUpdate(values) {
    await updateTicket(ticketId, values)
    await loadTicket()
  }

  async function handleClose() {
    setError('')
    setIsClosing(true)

    try {
      await closeTicket(ticketId)
      await loadTicket()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsClosing(false)
    }
  }

  if (!ticket && !error) {
    return <LoadingMessage />
  }

  if (!ticket) {
    return (
      <section>
        <ErrorMessage message={error} />
        <Link to="/tickets">Back to tickets</Link>
      </section>
    )
  }

  const isCreator = user?.id === ticket.createdBy
  const canEditAll = isCreator

  const creatorUser = users.find((u) => u.id === ticket.createdBy)
  const assignedUser = users.find((u) => u.id === ticket.assignedTo)

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{ticket.title}</h1>
          <p>
            Created {new Date(ticket.createdAt).toLocaleString()}
            {creatorUser && ` by ${creatorUser.name}`}
            {assignedUser ? ` • Assigned to ${assignedUser.name}` : ' • Unassigned'}
          </p>
        </div>
        {ticket.status !== 'closed' && (
          <button type="button" onClick={handleClose} disabled={isClosing}>
            {isClosing ? 'Closing…' : 'Close ticket'}
          </button>
        )}
      </div>
      <ErrorMessage message={error} />
      <TicketForm
        key={ticket.updatedAt}
        ticket={ticket}
        onSubmit={handleUpdate}
        submitLabel="Save changes"
        showStatus
        users={users}
        canEditAll={canEditAll}
      />
    </section>
  )
}

export default TicketDetailsPage
