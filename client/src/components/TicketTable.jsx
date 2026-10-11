import { Link } from 'react-router-dom'

function getAssigneeName(assignedToId, users) {
  if (!assignedToId) {
    return 'Unassigned'
  }
  const user = users.find((u) => u.id === assignedToId)
  return user ? user.name : 'Assigned'
}

function TicketTable({ tickets, users = [] }) {
  if (tickets.length === 0) {
    return <p>No tickets match these filters.</p>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned to</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
              </td>
              <td>{ticket.category}</td>
              <td>{ticket.priority}</td>
              <td>
                <span className={`status-label status-${ticket.status}`}>{ticket.status}</span>
              </td>
              <td>{getAssigneeName(ticket.assignedTo, users)}</td>
              <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TicketTable
