import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import Ticket from '../src/models/Ticket.js'

import User from '../src/models/User.js'

async function runExplain() {
  try {
    await connectDatabase()
    await Ticket.syncIndexes()

    // Find seed user if available, otherwise fallback to random ObjectId
    const seedUser = await User.findOne({ email: 'seed_alice@resolve.local' })
    const sampleUserId = seedUser ? seedUser._id : new mongoose.Types.ObjectId()
    console.log(`Running explain query for user ID: ${sampleUserId.toString()} (${seedUser ? seedUser.email : 'random sample'})`)

    // Query mimicking GET /api/tickets?scope=all&status=open&priority=high
    const filter = {
      $or: [{ createdBy: sampleUserId }, { assignedTo: sampleUserId }],
      status: 'open',
      priority: 'high',
    }

    const explanation = await Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip(0)
      .limit(10)
      .explain('executionStats')

    console.log('\n================ EXPLAIN EXECUTION STATS ================')
    console.log('Execution Time (ms):', explanation.executionStats?.executionTimeMillis)
    console.log('Total Docs Examined:', explanation.executionStats?.totalDocsExamined)
    console.log('Total Keys Examined:', explanation.executionStats?.totalKeysExamined)
    console.log('Documents Returned (nReturned):', explanation.executionStats?.nReturned)
    console.log('Winning Plan Stage:', explanation.queryPlanner?.winningPlan?.stage)
    console.log('Winning Plan Details:', JSON.stringify(explanation.queryPlanner?.winningPlan, null, 2))
    console.log('=========================================================\n')

    await mongoose.disconnect()
  } catch (error) {
    console.error('Failed to run explain:', error.message)
    process.exit(1)
  }
}

runExplain()

