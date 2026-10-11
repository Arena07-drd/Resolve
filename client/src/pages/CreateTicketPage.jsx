import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TicketForm from '../components/TicketForm.jsx'
import { createTicket } from '../services/ticketService.js'
import { getUsers } from '../services/userService.js'

function CreateTicketPage() {
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => {
        // Silently fall back to empty list if user cannot be fetched
      })
  }, [])

  async function handleCreate(values) {
    await createTicket(values)
    navigate('/tickets')
  }

  return (
    <section>
      <h1>Create ticket</h1>
      <TicketForm onSubmit={handleCreate} submitLabel="Create ticket" users={users} />
    </section>
  )
}

export default CreateTicketPage
