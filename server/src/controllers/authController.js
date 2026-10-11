import bcrypt from 'bcryptjs'
import { createAccessToken } from '../config/jwt.js'
import User from '../models/User.js'
import { loginSchema, registerSchema } from '../validators/authValidators.js'

const saltRounds = 12
const dummyPasswordHash = '$2a$12$e8uq/Mv42V98fL6rL5E20eJ1fL4qV5E20eJ1fL4qV5E20eJ1fL4qV'

function validationError(response, details) {
  return response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body.',
      details,
    },
  })
}

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function invalidCredentials(response) {
  return response.status(401).json({
    error: {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    },
  })
}

export async function register(request, response, next) {
  const result = registerSchema.safeParse(request.body)

  if (!result.success) {
    return validationError(response, result.error.flatten().fieldErrors)
  }

  try {
    const passwordHash = await bcrypt.hash(result.data.password, saltRounds)
    const user = await User.create({
      name: result.data.name,
      email: result.data.email,
      passwordHash,
    })

    return response.status(201).json({
      user: serializeUser(user),
      token: createAccessToken(user._id),
    })
  } catch (error) {
    return next(error)
  }
}

export async function login(request, response, next) {
  const result = loginSchema.safeParse(request.body)

  if (!result.success) {
    return validationError(response, result.error.flatten().fieldErrors)
  }

  try {
    const user = await User.findOne({ email: result.data.email }).select('+passwordHash')
    const hashToCompare = user ? user.passwordHash : dummyPasswordHash
    const passwordMatches = await bcrypt.compare(result.data.password, hashToCompare)

    if (!user || !passwordMatches) {
      return invalidCredentials(response)
    }

    return response.status(200).json({
      user: serializeUser(user),
      token: createAccessToken(user._id),
    })
  } catch (error) {
    return next(error)
  }
}

export function getCurrentUser(request, response) {
  return response.status(200).json({ user: serializeUser(request.user) })
}
