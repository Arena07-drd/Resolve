import { Router } from 'express'
import { getCurrentUser, login, register } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

const authRouter = Router()

authRouter.post('/register', authRateLimiter, register)
authRouter.post('/login', authRateLimiter, login)
authRouter.get('/me', authenticate, getCurrentUser)

export default authRouter
