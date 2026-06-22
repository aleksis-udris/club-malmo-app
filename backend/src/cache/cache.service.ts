import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

interface Entry {
  value: string
  expiresAt: number
}

/**
 * Caching + rate-limit primitive. Uses Redis when REDIS_URL is configured
 * (production / multi-instance) and otherwise an in-process Map (dev/demo).
 * Provides: get/set JSON with TTL, ETag store, a token bucket, and a
 * single-flight lock — the building blocks of the Sportradar cost controls.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly log = new Logger('CacheService')
  private redis?: Redis
  private readonly mem = new Map<string, Entry>()
  private readonly inflight = new Map<string, Promise<unknown>>()
  private readonly buckets = new Map<string, { tokens: number; updated: number }>()

  constructor(config: ConfigService) {
    const url = config.get<string>('redisUrl')
    if (url) {
      this.redis = new Redis(url, { lazyConnect: true, maxRetriesPerRequest: 2 })
      this.redis.connect().catch((e) => this.log.warn(`Redis connect failed: ${e.message}`))
      this.log.log('Cache backend: Redis')
    } else {
      this.log.log('Cache backend: in-memory (no REDIS_URL)')
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key)
    const e = this.mem.get(key)
    if (!e) return null
    if (e.expiresAt && e.expiresAt < Date.now()) {
      this.mem.delete(key)
      return null
    }
    return e.value
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.redis) {
      if (ttlSeconds) await this.redis.set(key, value, 'EX', ttlSeconds)
      else await this.redis.set(key, value)
      return
    }
    this.mem.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    })
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  }

  async setJSON(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds)
  }

  /** Token bucket; returns true if a token was available. */
  async takeToken(bucket: string, ratePerSec: number, burst = ratePerSec * 2): Promise<boolean> {
    const now = Date.now()
    const b = this.buckets.get(bucket) ?? { tokens: burst, updated: now }
    const refill = ((now - b.updated) / 1000) * ratePerSec
    b.tokens = Math.min(burst, b.tokens + refill)
    b.updated = now
    if (b.tokens >= 1) {
      b.tokens -= 1
      this.buckets.set(bucket, b)
      return true
    }
    this.buckets.set(bucket, b)
    return false
  }

  /** Block until a token is available (bounded wait). */
  async waitToken(bucket: string, ratePerSec: number): Promise<void> {
    for (let i = 0; i < 50; i++) {
      if (await this.takeToken(bucket, ratePerSec)) return
      await new Promise((r) => setTimeout(r, Math.ceil(1000 / Math.max(1, ratePerSec))))
    }
  }

  /** Coalesce concurrent callers for the same key into one execution. */
  async singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key) as Promise<T> | undefined
    if (existing) return existing
    const p = fn().finally(() => this.inflight.delete(key))
    this.inflight.set(key, p)
    return p
  }

  onModuleDestroy() {
    this.redis?.disconnect()
  }
}
