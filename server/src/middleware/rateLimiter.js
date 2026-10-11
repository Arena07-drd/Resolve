import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'

export function createRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? env.authRateLimitWindowMs,
    limit: options.limit ?? (() => env.authRateLimitMax),
    standardHeaders: 'draft-6',
    legacyHeaders: false,
    handler: (_request, response, _next, routeOptions) => {
      response.status(routeOptions.statusCode).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests. Please try again later.',
        },
      })
    },
    ...options,
  })
}

export const authRateLimiter = createRateLimiter()
