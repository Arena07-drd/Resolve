import { getDatabaseStatus } from '../config/database.js'

export function getHealth(_request, response) {
  const databaseStatus = getDatabaseStatus()
  const isDatabaseConnected = databaseStatus === 'connected'

  response.status(isDatabaseConnected ? 200 : 503).json({
    api: 'ok',
    database: databaseStatus,
  })
}
