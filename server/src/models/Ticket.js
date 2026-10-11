import mongoose from 'mongoose'
import { ticketPriorities, ticketStatuses } from '../validators/ticketValidators.js'

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    priority: {
      type: String,
      enum: ticketPriorities,
      default: 'medium',
    },
    status: {
      type: String,
      enum: ticketStatuses,
      default: 'open',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true },
)

ticketSchema.index({ createdBy: 1, createdAt: -1 })
ticketSchema.index({ assignedTo: 1, createdAt: -1 })

export default mongoose.model('Ticket', ticketSchema)
