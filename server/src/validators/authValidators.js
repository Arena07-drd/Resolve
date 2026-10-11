import { z } from 'zod'

const normalizedEmail = z.string().trim().email().transform((value) => value.toLowerCase())
const password = z.string().min(8).max(72)

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: normalizedEmail,
  password,
})

export const loginSchema = z.object({
  email: normalizedEmail,
  password,
})
