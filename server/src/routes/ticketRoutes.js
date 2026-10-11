import { Router } from 'express'
import {
  closeTicket,
  createTicket,
  deleteTicket,
  getTicket,
  listTickets,
  updateTicket,
} from '../controllers/ticketController.js'
import { authenticate } from '../middleware/authenticate.js'

const ticketRouter = Router()

ticketRouter.use(authenticate)
ticketRouter.post('/', createTicket)
ticketRouter.get('/', listTickets)
ticketRouter.get('/:ticketId', getTicket)
ticketRouter.patch('/:ticketId', updateTicket)
ticketRouter.patch('/:ticketId/close', closeTicket)
ticketRouter.delete('/:ticketId', deleteTicket)

export default ticketRouter
