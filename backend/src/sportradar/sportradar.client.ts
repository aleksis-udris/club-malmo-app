import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'
import { createHash } from 'crypto'
import { CacheService } from '../cache/cache.service'

export interface FetchResult<T> {
  data: T | null
  source: 'cache' | 'origin' | '304' | 'breaker-open' | 'disabled'
  changed: boolean
}

/**
 * Wraps every Sportradar call with the cost & resilience controls from the spec:
 * token-bucket rate limiting, conditional ETag requests (304 = cheap/no write),
 * single-flight coalescing, retry+backoff, and a circuit breaker. Returns last-good
 * cached data when the breaker is open or the integration is disabled.
 */
@Injectable()
export class SportradarClient {
  private readonly log = new Logger('SportradarClient')
  private readonly http: AxiosInstance
  private failures = 0
  private breakerOpenUntil = 0

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.http = axios.create({
      baseURL: this.config.get('sportradar.baseUrl'),
      timeout: 8000,
    })
  }

  private get enabled(): boolean {
    return !!this.config.get('sportradar.enabled')
  }

  async get<T>(key: string, path: string, ttlSeconds: number): Promise<FetchResult<T>> {
    if (!this.enabled) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'disabled', changed: false }
    }

    if (Date.now() < this.breakerOpenUntil) {
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'breaker-open', changed: false }
    }

    return this.cache.singleFlight(`sr:lock:${key}`, async () => {
      await this.cache.waitToken('sportradar', this.config.get<number>('sportradar.qps') ?? 1)
      const etag = await this.cache.get(`sr:etag:${key}`)
      const apiKey = this.config.get<string>('sportradar.apiKey')

      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await this.http.get<T>(path, {
            params: { api_key: apiKey },
            headers: etag ? { 'If-None-Match': etag } : {},
            validateStatus: (s) => s === 200 || s === 304,
          })
          this.failures = 0

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
          const status = err?.response?.status
          if (status === 429 || status >= 500 || !status) {
            const backoff = Math.min(2000, 250 * 2 ** attempt) + Math.floor(Math.random() * 100)
            await new Promise((r) => setTimeout(r, backoff))
            continue
          }
          throw err
        }
      }

      // Exhausted retries -> trip breaker, serve last-good cache.
      if (++this.failures >= 5) {
        this.breakerOpenUntil = Date.now() + 30_000
        this.log.warn('Sportradar circuit breaker OPEN for 30s')
      }
      const cached = await this.cache.getJSON<T>(`sr:data:${key}`)
      return { data: cached, source: 'breaker-open', changed: false }
    })
  }
}
