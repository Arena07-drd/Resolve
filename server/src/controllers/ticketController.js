import Ticket from '../models/Ticket.js'
import User from '../models/User.js'
import {
  createTicketSchema,
  listTicketsSchema,
  ticketParamsSchema,
  updateTicketSchema,
} from '../validators/ticketValidators.js'

function validationError(response, message, details) {
  return response.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message,
      details,
    },
  })
}

function ticketNotFound(response) {
  return response.status(404).json({
    error: {
      code: 'TICKET_NOT_FOUND',
      message: 'Ticket not found.',
    },
  })
}

function forbidden(response, message = 'Access denied.') {
  return response.status(403).json({
    error: {
      code: 'FORBIDDEN',
      message,
    },
  })
}

function serializeTicket(ticket) {
  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdBy: ticket.createdBy?.toString(),
    assignedTo: ticket.assignedTo ? ticket.assignedTo.toString() : null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  }
}

function parseTicketId(request, response) {
  const result = ticketParamsSchema.safeParse(request.params)

  if (!result.success) {
    validationError(response, 'Invalid route parameters.', result.error.flatten().fieldErrors)
    return null
  }

  return result.data.ticketId
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function createTicket(request, response, next) {
  const result = createTicketSchema.safeParse(request.body)

  if (!result.success) {
    return validationError(response, 'Invalid request body.', result.error.flatten().fieldErrors)
  }

  try {
    if (result.data.assignedTo) {
      const assigneeExists = await User.findById(result.data.assignedTo).select('_id')
      if (!assigneeExists) {
        return validationError(response, 'Invalid request body.', {
          assignedTo: ['Assigned user does not exist.'],
        })
      }
    }

    const ticket = await Ticket.create({
      ...result.data,
      createdBy: request.user._id,
    })

    return response.status(201).json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    return next(error)
  }
}

export async function listTickets(request, response, next) {
  const result = listTicketsSchema.safeParse(request.query)

  if (!result.success) {
    return validationError(response, 'Invalid query parameters.', result.error.flatten().fieldErrors)
  }

  const { page, limit, q, scope, ...filters } = result.data

  let ownershipCondition
  if (scope === 'created') {
    ownershipCondition = { createdBy: request.user._id }
  } else if (scope === 'assigned') {
    ownershipCondition = { assignedTo: request.user._id }
  } else {
    ownershipCondition = {
      $or: [{ createdBy: request.user._id }, { assignedTo: request.user._id }],
    }
  }

  const filter = {
    ...ownershipCondition,
    ...filters,
  }

  if (q) {
    const keyword = new RegExp(escapeRegularExpression(q), 'i')
    const searchCondition = [{ title: keyword }, { description: keyword }, { category: keyword }]
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchCondition }]
      delete filter.$or
    } else {
      filter.$or = searchCondition
    }
  }

  try {
    const [tickets, total] = await Promise.all([
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ticket.countDocuments(filter),
    ])

    return response.status(200).json({
      tickets: tickets.map(serializeTicket),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function getTicket(request, response, next) {
  const ticketId = parseTicketId(request, response)

  if (!ticketId) {
    return undefined
  }

  try {
    let ticket = await Ticket.findOne({ _id: ticketId, createdBy: request.user._id })

    if (!ticket) {
      ticket = await Ticket.findOne({ _id: ticketId, assignedTo: request.user._id })
    }

    if (!ticket) {
      return ticketNotFound(response)
    }

    return response.status(200).json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    return next(error)
  }
}

export async function updateTicket(request, response, next) {
  const ticketId = parseTicketId(request, response)

  if (!ticketId) {
    return undefined
  }

  const result = updateTicketSchema.safeParse(request.body)

  if (!result.success) {
    return validationError(response, 'Invalid request body.', result.error.flatten().fieldErrors)
  }

  try {
    if (result.data.assignedTo) {
      const assigneeExists = await User.findById(result.data.assignedTo).select('_id')
      if (!assigneeExists) {
        return validationError(response, 'Invalid request body.', {
          assignedTo: ['Assigned user does not exist.'],
        })
      }
    }

    let ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, createdBy: request.user._id },
      result.data,
      { new: true, runValidators: true },
    )

    if (ticket) {
      return response.status(200).json({ ticket: serializeTicket(ticket) })
    }

    const assignedTicket = await Ticket.findOne({ _id: ticketId, assignedTo: request.user._id })

    if (!assignedTicket) {
      return ticketNotFound(response)
    }

    const nonStatusKeys = Object.keys(result.data).filter((field) => field !== 'status')
    if (nonStatusKeys.length > 0) {
      return forbidden(response, 'Assignees may only update the ticket status.')
    }

    ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, assignedTo: request.user._id },
      { status: result.data.status },
      { new: true, runValidators: true },
    )

    return response.status(200).json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    return next(error)
  }
}

export async function closeTicket(request, response, next) {
  const ticketId = parseTicketId(request, response)

  if (!ticketId) {
    return undefined
  }

  try {
    let ticket = await Ticket.findOneAndUpdate(
      { _id: ticketId, createdBy: request.user._id },
      { status: 'closed' },
      { new: true, runValidators: true },
    )

    if (!ticket) {
      ticket = await Ticket.findOneAndUpdate(
        { _id: ticketId, assignedTo: request.user._id },
        { status: 'closed' },
        { new: true, runValidators: true },
      )
    }

    if (!ticket) {
      return ticketNotFound(response)
    }

    return response.status(200).json({ ticket: serializeTicket(ticket) })
  } catch (error) {
    return next(error)
  }
}

export async function deleteTicket(request, response, next) {
  const ticketId = parseTicketId(request, response)

  if (!ticketId) {
    return undefined
  }

  try {
    const ticket = await Ticket.findOneAndDelete({
      _id: ticketId,
      createdBy: request.user._id,
    })

    if (!ticket) {
      return ticketNotFound(response)
    }

    return response.status(200).json({
      message: 'Ticket deleted successfully.',
    })
  } catch (error) {
    return next(error)
  }
}
