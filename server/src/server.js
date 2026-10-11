import app from './app.js'
import { connectDatabase } from './config/database.js'
import { env, validateEnvironment } from './config/env.js'

async function startServer() {
  try {
    validateEnvironment()
  } catch (error) {
    console.error(`Unable to start Resolve API: ${error.message}`)
    process.exit(1)
  }

  try {
    await connectDatabase()

    app.listen(env.port, () => {
      console.log(`Resolve API listening on port ${env.port}`)
    })
  } catch {
    console.error(
      'Unable to start Resolve API: database connection failed. Check MONGODB_URI and Atlas network access.',
    )
    process.exit(1)
  }
}

startServer()
