import { useState } from 'react'
import { getApiErrorMessage } from '../services/api.js'
import ErrorMessage from './ErrorMessage.jsx'

const initialTicket = {
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  status: 'open',
  assignedTo: '',
}

function TicketForm({
  ticket = initialTicket,
  onSubmit,
  submitLabel,
  showStatus = false,
  users = [],
  canEditAll = true,
}) {
  const [values, setValues] = useState({
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    category: ticket.category ?? '',
    priority: ticket.priority ?? 'medium',
    status: ticket.status ?? 'open',
    assignedTo: ticket.assignedTo ?? '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateValue(event) {
    setValues((currentValues) => ({ ...currentValues, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      if (!canEditAll) {
        // Assignee only updates status
        await onSubmit({ status: values.status })
      } else {
        const payload = {
          ...values,
          assignedTo: values.assignedTo ? values.assignedTo : null,
        }
        if (!showStatus) {
          delete payload.status
        }
        await onSubmit(payload)
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      <ErrorMessage message={error} />
      {!canEditAll && (
        <p className="status-label status-in_progress">
          You are assigned to this ticket. You can update its status.
        </p>
      )}
      <label>
        Title
        <input
          name="title"
          value={values.title}
          onChange={updateValue}
          required
          maxLength="160"
          disabled={!canEditAll}
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          value={values.description}
          onChange={updateValue}
          required
          maxLength="5000"
          rows="5"
          disabled={!canEditAll}
        />
      </label>
      <label>
        Category
        <input
          name="category"
          value={values.category}
          onChange={updateValue}
          required
          maxLength="60"
          disabled={!canEditAll}
        />
      </label>
      <label>
        Priority
        <select
          name="priority"
          value={values.priority}
          onChange={updateValue}
          disabled={!canEditAll}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </label>
      <label>
        Assign to
        <select
          name="assignedTo"
          value={values.assignedTo}
          onChange={updateValue}
          disabled={!canEditAll}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </label>
      {showStatus && (
        <label>
          Status
          <select name="status" value={values.status} onChange={updateValue}>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  )
}

export default TicketForm
