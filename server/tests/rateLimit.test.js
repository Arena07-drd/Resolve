import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createRateLimiter } from '../src/middleware/rateLimiter.js'

describe('rateLimiter middleware', () => {
  it('allows requests within the configured limit and includes standard rate limit headers', async () => {
    const testApp = express()
    const limiter = createRateLimiter({ limit: 3, windowMs: 60000 })

    testApp.use(express.json())
    testApp.post('/auth/test', limiter, (_req, res) => res.status(200).json({ ok: true }))

    const firstResponse = await request(testApp).post('/auth/test')
    expect(firstResponse.status).toBe(200)
    expect(firstResponse.headers['ratelimit-limit']).toBe('3')
    expect(firstResponse.headers['ratelimit-remaining']).toBe('2')

    const secondResponse = await request(testApp).post('/auth/test')
    expect(secondResponse.status).toBe(200)
    expect(secondResponse.headers['ratelimit-remaining']).toBe('1')
  })

  it('returns HTTP 429 with consistent JSON error when limit is exceeded', async () => {
    const testApp = express()
    const limiter = createRateLimiter({ limit: 2, windowMs: 60000 })

    testApp.use(express.json())
    testApp.post('/auth/test', limiter, (_req, res) => res.status(200).json({ ok: true }))

    // First request - within limit
    const res1 = await request(testApp).post('/auth/test')
    expect(res1.status).toBe(200)

    // Second request - reaches limit
    const res2 = await request(testApp).post('/auth/test')
    expect(res2.status).toBe(200)

    // Third request - exceeds limit
    const res3 = await request(testApp).post('/auth/test')
    expect(res3.status).toBe(429)
    expect(res3.body).toEqual({
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please try again later.',
      },
    })
    expect(res3.headers['ratelimit-remaining']).toBe('0')
  })
})

