import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import authRouter from './routes/authRoutes.js'
import healthRouter from './routes/healthRoutes.js'
import ticketRouter from './routes/ticketRoutes.js'
import userRouter from './routes/userRoutes.js'

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/tickets', ticketRouter)
app.use('/api/users', userRouter)
app.use(notFound)
app.use(errorHandler)

export default app
