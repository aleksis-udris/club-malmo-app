export interface AppConfig {
  port: number
  nodeEnv: string
  corsOrigin: string
  jwtSecret: string
  jwtExpires: string
  provisioningKey: string
  databaseUrl?: string
  redisUrl?: string
  sportradar: {
    apiKey: string
    baseUrl: string
    enabled: boolean
    qps: number
    seasonId: string
    competitionId: string
  }
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpires: process.env.JWT_EXPIRES ?? '10m',
  provisioningKey: process.env.DEVICE_PROVISIONING_KEY ?? 'dev-tv-provisioning-key',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  sportradar: {
    apiKey: process.env.SPORTRADAR_API_KEY ?? '',
    baseUrl: process.env.SPORTRADAR_BASE_URL ?? 'https://api.sportradar.com/squash/trial/v2/en',
    enabled:
      (process.env.SPORTRADAR_ENABLED ?? 'false') === 'true' &&
      !!(process.env.SPORTRADAR_API_KEY ?? ''),
    qps: parseInt(process.env.SPORTRADAR_QPS ?? '1', 10),
    seasonId: process.env.SPORTRADAR_SEASON_ID ?? '',
    competitionId: process.env.SPORTRADAR_COMPETITION_ID ?? '',
  },
})
