import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-not-used-in-production'
})

vi.mock('../src/models/User.js', () => ({
  default: {
    findById: vi.fn(),
  },
}))

vi.mock('../src/models/Ticket.js', () => ({
  default: {
    countDocuments: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}))

import app from '../src/app.js'
import { createAccessToken } from '../src/config/jwt.js'
import Ticket from '../src/models/Ticket.js'
import User from '../src/models/User.js'

const ownerId = '507f1f77bcf86cd799439011'
const otherUserId = '507f1f77bcf86cd799439012'
const ticketId = '507f1f77bcf86cd799439013'
const ticket = {
  _id: ticketId,
  title: 'Cannot sign in',
  description: 'The login form returns an error.',
  category: 'account',
  priority: 'high',
  status: 'open',
  createdBy: ownerId,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

function selectResult(result) {
  return { select: vi.fn().mockResolvedValue(result) }
}

function authorizationHeader(userId = ownerId) {
  return { Authorization: `Bearer ${createAccessToken(userId)}` }
}

function ticketListResult(tickets) {
  const limit = vi.fn().mockResolvedValue(tickets)
  const skip = vi.fn().mockReturnValue({ limit })
  const sort = vi.fn().mockReturnValue({ skip })

  return { sort, skip, limit }
}

describe('ticket routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.findById.mockImplementation((userId) => selectResult({ _id: userId, role: 'user' }))
  })

  it('creates a ticket owned by the authenticated user', async () => {
    Ticket.create.mockResolvedValue(ticket)

    const response = await request(app)
      .post('/api/tickets')
      .set(authorizationHeader())
      .send({
        title: 'Cannot sign in',
        description: 'The login form returns an error.',
        category: 'account',
        priority: 'high',
      })

    expect(response.status).toBe(201)
    expect(response.body.ticket.createdBy).toBe(ownerId)
    expect(Ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: ownerId,
        priority: 'high',
      }),
    )
  })

  it('lists only owned tickets with filters, search, pagination, and newest-first sorting', async () => {
    const query = ticketListResult([ticket])
    Ticket.find.mockReturnValue(query)
    Ticket.countDocuments.mockResolvedValue(1)

    const response = await request(app)
      .get('/api/tickets?scope=created&status=open&priority=high&q=login&page=2&limit=5')
      .set(authorizationHeader())

    expect(response.status).toBe(200)
    expect(response.body.pagination).toEqual({ page: 2, limit: 5, total: 1, totalPages: 1 })
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 })
    expect(query.skip).toHaveBeenCalledWith(5)
    expect(query.limit).toHaveBeenCalledWith(5)
    expect(Ticket.find.mock.calls[0][0]).toMatchObject({
      createdBy: ownerId,
      status: 'open',
      priority: 'high',
    })
  })

  it('gets an owned ticket', async () => {
    Ticket.findOne.mockResolvedValue(ticket)

    const response = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set(authorizationHeader())

    expect(response.status).toBe(200)
    expect(response.body.ticket.id).toBe(ticketId)
    expect(Ticket.findOne).toHaveBeenCalledWith({ _id: ticketId, createdBy: ownerId })
  })

  it('updates an owned ticket and closes it through the dedicated route', async () => {
    Ticket.findOneAndUpdate.mockResolvedValue({ ...ticket, priority: 'low' })

    const updateResponse = await request(app)
      .patch(`/api/tickets/${ticketId}`)
      .set(authorizationHeader())
      .send({ priority: 'low' })

    expect(updateResponse.status).toBe(200)
    expect(Ticket.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ticketId, createdBy: ownerId },
      { priority: 'low' },
      { new: true, runValidators: true },
    )

    Ticket.findOneAndUpdate.mockResolvedValue({ ...ticket, status: 'closed' })
    const closeResponse = await request(app)
      .patch(`/api/tickets/${ticketId}/close`)
      .set(authorizationHeader())

    expect(closeResponse.status).toBe(200)
    expect(closeResponse.body.ticket.status).toBe('closed')
    expect(Ticket.findOneAndUpdate).toHaveBeenLastCalledWith(
      { _id: ticketId, createdBy: ownerId },
      { status: 'closed' },
      { new: true, runValidators: true },
    )
  })

  it('rejects invalid ticket input and protected fields', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .set(authorizationHeader())
      .send({
        title: '',
        createdBy: otherUserId,
      })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(Ticket.create).not.toHaveBeenCalled()
  })

  it('rejects a missing authentication token', async () => {
    const response = await request(app).get('/api/tickets')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
    expect(Ticket.find).not.toHaveBeenCalled()
  })

  it('does not disclose another users ticket', async () => {
    Ticket.findOne.mockResolvedValue(null)
    Ticket.findOneAndUpdate.mockResolvedValue(null)

    const getResponse = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(otherUserId))

    expect(getResponse.status).toBe(404)
    expect(Ticket.findOne).toHaveBeenCalledWith({ _id: ticketId, createdBy: otherUserId })

    const updateResponse = await request(app)
      .patch(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(otherUserId))
      .send({ status: 'closed' })

    expect(updateResponse.status).toBe(404)
    expect(Ticket.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: ticketId, createdBy: otherUserId },
      { status: 'closed' },
      { new: true, runValidators: true },
    )
  })

  it('creates a ticket with an assigned user', async () => {
    Ticket.create.mockResolvedValue({ ...ticket, assignedTo: otherUserId })

    const response = await request(app)
      .post('/api/tickets')
      .set(authorizationHeader())
      .send({
        title: 'Cannot sign in',
        description: 'The login form returns an error.',
        category: 'account',
        priority: 'high',
        assignedTo: otherUserId,
      })

    expect(response.status).toBe(201)
    expect(response.body.ticket.assignedTo).toBe(otherUserId)
    expect(Ticket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        createdBy: ownerId,
        assignedTo: otherUserId,
      }),
    )
  })

  it('allows an assignee to view the assigned ticket and update status', async () => {
    const assignedTicket = { ...ticket, createdBy: otherUserId, assignedTo: ownerId }
    Ticket.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(assignedTicket)

    const getResponse = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(ownerId))

    expect(getResponse.status).toBe(200)
    expect(getResponse.body.ticket.id).toBe(ticketId)

    Ticket.findOneAndUpdate
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...assignedTicket, status: 'in_progress' })
    Ticket.findOne.mockResolvedValueOnce(assignedTicket)

    const updateResponse = await request(app)
      .patch(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(ownerId))
      .send({ status: 'in_progress' })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.ticket.status).toBe('in_progress')
  })

  it('forbids an assignee from updating non-status fields', async () => {
    const assignedTicket = { ...ticket, createdBy: otherUserId, assignedTo: ownerId }
    Ticket.findOneAndUpdate.mockResolvedValueOnce(null)
    Ticket.findOne.mockResolvedValueOnce(assignedTicket)

    const updateResponse = await request(app)
      .patch(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(ownerId))
      .send({ title: 'New title' })

    expect(updateResponse.status).toBe(403)
    expect(updateResponse.body.error.code).toBe('FORBIDDEN')
  })

  it('rejects creating a ticket when assignedTo user does not exist', async () => {
    User.findById.mockImplementation((userId) => {
      if (userId === ownerId) return selectResult({ _id: userId, role: 'user' })
      return selectResult(null)
    })

    const response = await request(app)
      .post('/api/tickets')
      .set(authorizationHeader())
      .send({
        title: 'Cannot sign in',
        description: 'The login form returns an error.',
        category: 'account',
        priority: 'high',
        assignedTo: otherUserId,
      })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details).toHaveProperty('assignedTo')
  })

  it('deletes an owned ticket', async () => {
    Ticket.findOneAndDelete.mockResolvedValue(ticket)

    const response = await request(app)
      .delete(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(ownerId))

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Ticket deleted successfully.')
    expect(Ticket.findOneAndDelete).toHaveBeenCalledWith({
      _id: ticketId,
      createdBy: ownerId,
    })
  })

  it('rejects deleting a ticket owned by another user', async () => {
    Ticket.findOneAndDelete.mockResolvedValue(null)

    const response = await request(app)
      .delete(`/api/tickets/${ticketId}`)
      .set(authorizationHeader(otherUserId))

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('TICKET_NOT_FOUND')
    expect(Ticket.findOneAndDelete).toHaveBeenCalledWith({
      _id: ticketId,
      createdBy: otherUserId,
    })
  })
})
