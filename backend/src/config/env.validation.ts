import * as Joi from 'joi'

// Validates env at boot. Most values have safe dev defaults so the app
// runs out-of-the-box (in-memory SQLite + no Redis + Sportradar disabled).
export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  CORS_ORIGIN: Joi.string().default('*'),
  JWT_SECRET: Joi.string().min(8).default('dev-secret-change-me'),
  JWT_EXPIRES: Joi.string().default('15m'),
  DEVICE_PROVISIONING_KEY: Joi.string().default('dev-tv-provisioning-key'),
  DATABASE_URL: Joi.string().optional(),
  REDIS_URL: Joi.string().optional(),
  SPORTRADAR_API_KEY: Joi.string().allow('').optional(),
  SPORTRADAR_BASE_URL: Joi.string().optional(),
  SPORTRADAR_ENABLED: Joi.string().valid('true', 'false').default('false'),
  SPORTRADAR_QPS: Joi.number().default(1),
})
