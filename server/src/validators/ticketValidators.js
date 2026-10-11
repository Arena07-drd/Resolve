import { z } from 'zod'

export const ticketPriorities = ['low', 'medium', 'high']
export const ticketStatuses = ['open', 'in_progress', 'closed']

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ticket ID.')
const assignedToField = z
  .union([objectId, z.literal(''), z.null()])
  .optional()
  .transform((val) => (val === '' ? null : val))

const ticketFields = {
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(5000),
  category: z.string().trim().min(1).max(60),
  priority: z.enum(ticketPriorities),
  status: z.enum(ticketStatuses),
  assignedTo: assignedToField,
}

export const createTicketSchema = z
  .object({
    title: ticketFields.title,
    description: ticketFields.description,
    category: ticketFields.category,
    priority: ticketFields.priority.default('medium'),
    assignedTo: assignedToField,
  })
  .strict()

export const updateTicketSchema = z
  .object(ticketFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update.')

export const ticketParamsSchema = z.object({ ticketId: objectId })

export const listTicketsSchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  priority: z.enum(ticketPriorities).optional(),
  scope: z.enum(['all', 'created', 'assigned']).optional().default('all'),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
