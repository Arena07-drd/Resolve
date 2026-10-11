import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('GET /api/health', () => {
  it('reports a disconnected database without claiming the API is unavailable', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({
      api: 'ok',
      database: 'disconnected',
    })
  })

  it('includes standard security headers from helmet', async () => {
    const response = await request(app).get('/api/health')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
    expect(response.headers).toHaveProperty('content-security-policy')
  })
})
