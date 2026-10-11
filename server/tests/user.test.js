import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-not-used-in-production'
})

vi.mock('../src/models/User.js', () => ({
  default: {
    findById: vi.fn(),
    find: vi.fn(),
  },
}))

import app from '../src/app.js'
import { createAccessToken } from '../src/config/jwt.js'
import User from '../src/models/User.js'

const callerId = '507f1f77bcf86cd799439011'
const usersList = [
  { _id: '507f1f77bcf86cd799439011', name: 'Asha Patel', email: 'asha@example.com' },
  { _id: '507f1f77bcf86cd799439012', name: 'Bob Smith', email: 'bob@example.com' },
]

function selectResult(result) {
  return { select: vi.fn().mockResolvedValue(result) }
}

function userFindResult(users) {
  const sort = vi.fn().mockResolvedValue(users)
  const select = vi.fn().mockReturnValue({ sort })
  return { select }
}

describe('user routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    User.findById.mockImplementation((userId) => selectResult({ _id: userId, role: 'user' }))
  })

  it('lists users for authenticated callers to enable ticket assignment', async () => {
    User.find.mockReturnValue(userFindResult(usersList))

    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${createAccessToken(callerId)}`)

    expect(response.status).toBe(200)
    expect(response.body.users).toEqual([
      { id: '507f1f77bcf86cd799439011', name: 'Asha Patel', email: 'asha@example.com' },
      { id: '507f1f77bcf86cd799439012', name: 'Bob Smith', email: 'bob@example.com' },
    ])
  })

  it('rejects unauthenticated requests to list users', async () => {
    const response = await request(app).get('/api/users')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })
})

