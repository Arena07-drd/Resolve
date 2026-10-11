import dns from 'node:dns'

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from 'mongoose'
import { env } from './env.js'

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

export async function connectDatabase() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not configured')
  }

  await mongoose.connect(env.mongoUri)
  console.log('MongoDB connected')
}

export function getDatabaseStatus() {
  return connectionStates[mongoose.connection.readyState] ?? 'unknown'
}
