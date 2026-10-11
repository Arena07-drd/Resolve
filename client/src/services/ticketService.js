import api from './api.js'

export async function createTicket(ticket) {
  const response = await api.post('/tickets', ticket)
  return response.data.ticket
}

export async function getTicket(ticketId) {
  const response = await api.get(`/tickets/${ticketId}`)
  return response.data.ticket
}

export async function getTickets(parameters) {
  const response = await api.get('/tickets', { params: parameters })
  return response.data
}

export async function updateTicket(ticketId, updates) {
  const response = await api.patch(`/tickets/${ticketId}`, updates)
  return response.data.ticket
}

export async function closeTicket(ticketId) {
  const response = await api.patch(`/tickets/${ticketId}/close`)
  return response.data.ticket
}

export async function deleteTicket(ticketId) {
  const response = await api.delete(`/tickets/${ticketId}`)
  return response.data
}
