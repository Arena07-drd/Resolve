import User from '../models/User.js'
import { verifyAccessToken } from '../config/jwt.js'

function unauthorized(response, message) {
  return response.status(401).json({
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
  })
}

export async function authenticate(request, response, next) {
  const authorization = request.get('authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return unauthorized(response, 'Authentication required.')
  }

  let payload

  try {
    payload = verifyAccessToken(authorization.slice(7))
  } catch {
    return unauthorized(response, 'Invalid or expired token.')
  }

  try {
    const user = await User.findById(payload.sub).select('-passwordHash')

    if (!user) {
      return unauthorized(response, 'Authentication required.')
    }

    request.user = user
    return next()
  } catch (error) {
    return next(error)
  }
}
