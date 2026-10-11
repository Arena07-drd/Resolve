import 'dotenv/config'

export const env = {
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  jwtSecret: process.env.JWT_SECRET,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000),
}

export function validateEnvironment() {
  const requiredValues = {
    JWT_SECRET: env.jwtSecret,
    MONGODB_URI: env.mongoUri,
  }
  const missing = Object.entries(requiredValues)
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
