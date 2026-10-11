import jwt from 'jsonwebtoken'
import { env } from './env.js'

function getJwtSecret() {
  if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not configured')
  }

  return env.jwtSecret
}

export function createAccessToken(userId) {
  return jwt.sign({ sub: userId.toString() }, getJwtSecret(), {
    expiresIn: env.jwtExpiresIn,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret())
}
