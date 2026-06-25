import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import axios, { AxiosInstance } from 'axios'
import { createHash } from 'crypto'
import { CacheService } from '../cache/cache.service'
import { SyncState } from './entities/sync-state.entity'

export interface FetchResult<T> {
  data: T | null
  source: 'cache' | 'origin' | '304' | 'breaker-open' | 'disabled' | 'off-hours' | 'quota'
  changed: boolean
}

/**
 * Wraps every Sportradar (Squash v2) call with cost & resilience controls:
 * TTL freshness (skip origin while cached data is fresh), token-bucket rate
 * limiting, a per-day request budget (persisted to the DB so it survives
 * restarts), a working-hours window, conditional ETag requests, single-flight
 * coalescing, retry+backoff, and a circuit breaker. Returns last-good cached
 * data when it can't (or shouldn't) call origin.
 */
@Injectable()
export class SportradarClient {
  private readonly log = new Logger('SportradarClient')
  private readonly http: AxiosInstance
  private failures = 0
  private breakerOpenUntil = 0

  // Per-day origin-request budget. Mirrored in the DB (resourceKey BUDGET_KEY)
  // so a restart resumes the same day's count instead of starting over.
  private static readonly BUDGET_KEY = 'request:budget'
  private dayKey = ''
  private count = 0
  private loaded = false
  private loadingP: Promise<void> | null = null

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
    @InjectRepository(SyncState)
    private readonly budget: Repository<SyncState>,
  ) {
    this.http = axios.create({
      baseURL: this.config.get('sportradar.baseUrl'),
      timeout: 8000,
    })
  }

  private get enabled(): boolean {
    return !!this.config.get('sportradar.enabled')
  }

  /** Load the persisted counter once; restores today's count after a restart. */
  private ensureLoaded(): Promise<void> {
    if (this.loaded) return Promise.resolve()
    if (!this.loadingP) {
      this.loadingP = (async () => {
        const today = new Date().toDateString()
        try {
          const row = await this.budget.findOne({
            where: { resourceKey: SportradarClient.BUDGET_KEY },
          })
          this.count = row && row.contentHash === today ? row.failureCount ?? 0 : 0
        } catch {
          this.count = 0
        }
        this.dayKey = today
        this.loaded = true
      })()
    }
    return this.loadingP
  }

  /** Persist the current day + count (fire-and-forget; survives restarts). */
  private persistBudget(): void {
    void this.budget
      .save(
        this.budget.create({
          resourceKey: SportradarClient.BUDGET_KEY,
          contentHash: this.dayKey,
          failureCount: this.count,
          lastSyncedAt: new Date(),
        }),
      )
      .catch((e) => this.log.debug(`budget persist failed: ${e?.message ?? e}`))
  }

  /** Reset the counter when the calendar day changes. */
  private rollDay(): void {
    const today = new Date().toDateString()
    if (today !== this.dayKey) {
      this.dayKey = today
      this.count = 0
      this.persistBudget()
    }
  }

  /** Calls are only made during the club's working hours (local 24h clock). */
  private withinWorkHours(): boolean {
    const start = this.config.get<number>('sportradar.workStartHour') ?? 9
    const end = this.config.get<number>('sportradar.workEndHour') ?? 17
    const h = new Date().getHours()
    return h >= start && h < end
  }

  private dailyLimit(): number {
    return this.config.get<number>('sportradar.dailyLimit') ?? 1000
  }

  private underDailyLimit(): boolean {
    this.rollDay()
    return this.count < this.dailyLimit()
  }

  /** Count one origin request against today's budget and persist it. */
  private noteOriginRequest(): void {
    this.rollDay()
    this.count += 1
    this.persistBudget()
    if (this.count === this.dailyLimit()) {
      this.log.warn(`Sportradar daily request limit reached (${this.count}); serving cache until tomorrow.`)
    }
  }

  /** Diagnostics: how many origin requests have been spent today. */
  get requestsToday(): number {
    this.rollDay()
    return this.count
  }

  /** True once today's budget is used up. */
  get quotaExhausted(): boolean {
    this.rollDay()
    return this.count >= this.dailyLimit()
  }

  /** True while inside the configured club working hours. */
  get inWorkHours(): boolean {
    return this.withinWorkHours()
  }

  async get<T>(key: string, path: string, ttlSeconds: number): Promise<FetchResult<T>> {
    if (!this.enabled) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'disabled', changed: false }
    }

    // 1) Freshness — while cached data is younger than its TTL, never call origin.
    const tsRaw = await this.cache.get(`sr:ts:${key}`)
    if (tsRaw && Date.now() - Number(tsRaw) < ttlSeconds * 1000) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      if (cached !== null) return { data: cached, source: 'cache', changed: false }
    }

    // 2) Circuit breaker open — serve last-good cache.
    if (Date.now() < this.breakerOpenUntil) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'breaker-open', changed: false }
    }

    // Make sure the persisted budget is loaded before any gating decision.
    await this.ensureLoaded()

    // 3) Budget gates — outside working hours or over the daily cap -> cache only.
    if (!this.withinWorkHours()) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'off-hours', changed: false }
    }
    if (!this.underDailyLimit()) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'quota', changed: false }
    }

    return this.cache.singleFlight(`sr:lock:${key}`, async () => {
      // Re-check freshness inside the lock (a concurrent flight may have refreshed).
      const ts2 = await this.cache.get(`sr:ts:${key}`)
      if (ts2 && Date.now() - Number(ts2) < ttlSeconds * 1000) {
        const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
        if (cached !== null) return { data: cached, source: 'cache', changed: false }
      }

      await this.cache.waitToken('sportradar', this.config.get<number>('sportradar.qps') ?? 1)
      const etag = await this.cache.get(`sr:etag:${key}`)
      const apiKey = this.config.get<string>('sportradar.apiKey')

      let lastStatus: number | undefined
      for (let attempt = 0; attempt < 4; attempt++) {
        // Re-check the daily cap before every network attempt (retries cost too).
        if (!this.underDailyLimit()) {
          const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
          return { data: cached, source: 'quota', changed: false }
        }
        try {
          this.noteOriginRequest()
          const res = await this.http.get<T>(path, {
            // v2 auth: x-api-key header (preferred) + api_key query (trial-friendly).
            params: { api_key: apiKey },
            headers: {
              'x-api-key': apiKey,
              accept: 'application/json',
              ...(etag ? { 'If-None-Match': etag } : {}),
            },
            validateStatus: (s) => s === 200 || s === 304,
          })
          this.failures = 0
          // Mark fresh now so freshness gating applies regardless of 200/304.
          await this.cache.set(`sr:ts:${key}`, String(Date.now()), ttlSeconds)

          if (res.status === 304) {
            const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
            await this.cache.set(`sr:data:${key}`, JSON.stringify(cached), ttlSeconds)
            return { data: cached, source: '304', changed: false }
          }

          const hash = createHash('sha256').update(JSON.stringify(res.data)).digest('hex')
          const prevHash = await this.cache.get(`sr:hash:${key}`)
          if (res.headers.etag) await this.cache.set(`sr:etag:${key}`, res.headers.etag)
          await this.cache.set(`sr:data:${key}`, JSON.stringify(res.data), ttlSeconds)
          await this.cache.set(`sr:hash:${key}`, hash)
          return { data: res.data, source: 'origin', changed: hash !== prevHash }
        } catch (err: any) {
          lastStatus = err?.response?.status
          if (lastStatus === 429 || (lastStatus ?? 500) >= 500 || !lastStatus) {
            const backoff = Math.min(3000, 400 * 2 ** attempt) + Math.floor(Math.random() * 150)
            await new Promise((r) => setTimeout(r, backoff))
            continue
          }
          throw err
        }
      }

      // Pure rate limiting (429) should NOT trip the breaker — just serve cached.
      if (lastStatus !== 429) {
        if (++this.failures >= 5) {
          this.breakerOpenUntil = Date.now() + 10_000
          this.log.warn('Sportradar circuit breaker OPEN for 10s')
        }
      }
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'breaker-open', changed: false }
    })
  }
}
