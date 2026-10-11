import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDatabase } from '../src/config/database.js'
import { env } from '../src/config/env.js'
import Ticket from '../src/models/Ticket.js'
import User from '../src/models/User.js'

// Safety check: Never run in production
if (env.nodeEnv === 'production') {
  console.error('CRITICAL: Seeding is strictly forbidden in production (NODE_ENV=production).')
  process.exit(1)
}

const TOTAL_TICKETS = 10000
const BATCH_SIZE = 1000

const SEED_USER_SPECS = [
  { name: 'Seed Alice', email: 'seed_alice@resolve.local' },
  { name: 'Seed Bob', email: 'seed_bob@resolve.local' },
  { name: 'Seed Charlie', email: 'seed_charlie@resolve.local' },
  { name: 'Seed Diana', email: 'seed_diana@resolve.local' },
  { name: 'Seed Evan', email: 'seed_evan@resolve.local' },
]

const CATEGORIES = [
  'billing',
  'authentication',
  'performance',
  'integrations',
  'bug-report',
  'feature-request',
  'security',
  'ui-issue',
]

const PRIORITIES = ['low', 'medium', 'high']
const STATUSES = ['open', 'in_progress', 'closed']

// Weighted distribution helper
function pickWeighted(items, weights) {
  const random = Math.random()
  let sum = 0
  for (let i = 0; i < items.length; i++) {
    sum += weights[i]
    if (random <= sum) return items[i]
  }
  return items[items.length - 1]
}

async function ensureSeedUsers() {
  const seedUsers = []
  const passwordHash = await bcrypt.hash('SeedPassword123!', 10)

  for (const spec of SEED_USER_SPECS) {
    let user = await User.findOne({ email: spec.email })
    if (!user) {
      user = await User.create({
        name: spec.name,
        email: spec.email,
        passwordHash,
        role: 'user',
      })
    }
    seedUsers.push(user)
  }

  return seedUsers
}

async function seed() {
  const startTime = Date.now()

  try {
    console.log('Connecting to database...')
    await connectDatabase()
    console.log(`Connected to database. Target NODE_ENV: ${env.nodeEnv}`)

    // 1. Ensure dedicated seed users exist
    console.log('Ensuring dedicated seed users exist...')
    const seedUsers = await ensureSeedUsers()
    const seedUserIds = seedUsers.map((u) => u._id)
    console.log(`Found/created ${seedUsers.length} seed users. Primary benchmark user: ${seedUsers[0].email} (${seedUsers[0]._id})`)

    // 2. Clean up previous seed tickets ONLY (scoped strictly to seed users)
    const cleanupResult = await Ticket.deleteMany({ createdBy: { $in: seedUserIds } })
    if (cleanupResult.deletedCount > 0) {
      console.log(`Cleaned up ${cleanupResult.deletedCount} existing seed tickets from previous runs.`)
    }

    // 3. Generate and insert tickets in batches
    console.log(`Generating and inserting ${TOTAL_TICKETS} representative tickets in batches of ${BATCH_SIZE}...`)

    const now = Date.now()
    const oneHundredDaysMs = 100 * 24 * 60 * 60 * 1000

    let insertedSoFar = 0

    for (let batchStart = 0; batchStart < TOTAL_TICKETS; batchStart += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, TOTAL_TICKETS - batchStart)
      const ticketsBatch = []

      for (let i = 0; i < batchCount; i++) {
        const globalIndex = batchStart + i

        // Distribution of owners:
        // User 0 (Alice) gets 40% of all tickets (representing a high-volume active user for testing pagination and sorting)
        // User 1 (Bob) gets 25%
        // Users 2, 3, 4 share the remaining 35%
        const ownerIndex = pickWeighted([0, 1, 2, 3, 4], [0.4, 0.25, 0.15, 0.1, 0.1])
        const creator = seedUsers[ownerIndex]

        // 30% of tickets have an assignee (different user)
        let assignee = null
        if (Math.random() < 0.3) {
          const possibleAssignees = seedUsers.filter((u) => !u._id.equals(creator._id))
          assignee = possibleAssignees[Math.floor(Math.random() * possibleAssignees.length)]
        }

        // Priority distribution: 55% medium, 30% low, 15% high
        const priority = pickWeighted(PRIORITIES, [0.3, 0.55, 0.15])

        // Status distribution: 45% closed, 35% in_progress, 20% open
        const status = pickWeighted(STATUSES, [0.2, 0.35, 0.45])

        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]

        // Random timestamp within the last 100 days
        const randomAgeMs = Math.floor(Math.random() * oneHundredDaysMs)
        const createdAt = new Date(now - randomAgeMs)
        const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 86400000))

        ticketsBatch.push({
          title: `[Seed ${globalIndex + 1}] Issue with ${category} service`,
          description: `Detailed description for simulated ticket #${globalIndex + 1}. Covers ${category} subsystem behavior under ${priority} priority.`,
          category,
          priority,
          status,
          createdBy: creator._id,
          assignedTo: assignee ? assignee._id : null,
          createdAt,
          updatedAt,
        })
      }

      await Ticket.insertMany(ticketsBatch, { ordered: false })
      insertedSoFar += batchCount
      console.log(`Inserted ${insertedSoFar} / ${TOTAL_TICKETS} tickets...`)
    }

    // 4. Verification count
    const totalInCollection = await Ticket.countDocuments()
    const totalSeeded = await Ticket.countDocuments({ createdBy: { $in: seedUserIds } })
    const aliceSeeded = await Ticket.countDocuments({ createdBy: seedUsers[0]._id })

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(2)

    console.log('\n================ SEED COMPLETE ================')
    console.log(`Duration: ${durationSeconds}s`)
    console.log(`Seed tickets inserted: ${totalSeeded}`)
    console.log(`Primary user (Alice) tickets: ${aliceSeeded}`)
    console.log(`Total documents in 'tickets' collection: ${totalInCollection}`)
    console.log('Primary benchmark user ID:', seedUsers[0]._id.toString())
    console.log('===============================================\n')

    await mongoose.disconnect()
  } catch (error) {
    console.error('Seed process failed:', error.message)
    process.exit(1)
  }
}

seed()

