import bcrypt from 'bcryptjs'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-that-is-not-used-in-production'
})

vi.mock('../src/models/User.js', () => ({
  default: {
    create: vi.fn(),
    findById: vi.fn(),
    findOne: vi.fn(),
  },
}))

import app from '../src/app.js'
import User from '../src/models/User.js'

const user = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Asha Patel',
  email: 'asha@example.com',
  passwordHash: '',
  role: 'user',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}

function selectResult(result) {
  return { select: vi.fn().mockResolvedValue(result) }
}

describe('authentication routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a user without exposing passwordHash or accepting a role', async () => {
    User.create.mockResolvedValue(user)

    const response = await request(app).post('/api/auth/register').send({
      name: 'Asha Patel',
      email: 'ASHA@EXAMPLE.COM',
      password: 'strong-password-123',
      role: 'admin',
    })

    expect(response.status).toBe(201)
    expect(response.body.user).not.toHaveProperty('passwordHash')
    expect(response.body.user.role).toBe('user')
    expect(response.body.token).toEqual(expect.any(String))
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'asha@example.com',
        name: 'Asha Patel',
      }),
    )
    expect(User.create.mock.calls[0][0].passwordHash).not.toBe('strong-password-123')
  })

  it('returns a conflict for duplicate email registration', async () => {
    User.create.mockRejectedValue({ code: 11000 })

    const response = await request(app).post('/api/auth/register').send({
      name: 'Asha Patel',
      email: 'asha@example.com',
      password: 'strong-password-123',
    })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS')
  })

  it('returns generic invalid credentials for a bad password', async () => {
    const passwordHash = await bcrypt.hash('correct-password-123', 4)
    User.findOne.mockReturnValue(selectResult({ ...user, passwordHash }))

    const response = await request(app).post('/api/auth/login').send({
      email: 'asha@example.com',
      password: 'incorrect-password-123',
    })

    expect(response.status).toBe(401)
    expect(response.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    })
  })

  it('returns generic invalid credentials when user email does not exist', async () => {
    User.findOne.mockReturnValue(selectResult(null))

    const response = await request(app).post('/api/auth/login').send({
      email: 'nonexistent@example.com',
      password: 'some-password-123',
    })

    expect(response.status).toBe(401)
    expect(response.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    })
  })

  it('rejects a request without a token', async () => {
    const response = await request(app).get('/api/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-valid-token')

    expect(response.status).toBe(401)
    expect(response.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired token.',
    })
  })
})
