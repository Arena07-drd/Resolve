import { Router } from 'express'
import { listUsers } from '../controllers/userController.js'
import { authenticate } from '../middleware/authenticate.js'

const userRouter = Router()

userRouter.use(authenticate)
userRouter.get('/', listUsers)

export default userRouter

