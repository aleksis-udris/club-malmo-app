import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SportradarClient } from './sportradar.client'
import { SrEvent } from './entities/sr-event.entity'
import { SrRanking } from './entities/sr-ranking.entity'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Normalises and stores Sportradar data into the local mirror, and serves
 * read models from the DB so clients never hit origin. All sync methods no-op
 * gracefully when the integration is disabled (no API key) — reads still work,
 * returning whatever is cached locally.
 */
@Injectable()
export class SportradarService {
  private readonly log = new Logger('SportradarService')

  constructor(
    private readonly client: SportradarClient,
    private readonly config: ConfigService,
    @InjectRepository(SrEvent) private readonly events: Repository<SrEvent>,
    @InjectRepository(SrRanking) private readonly rankings: Repository<SrRanking>,
  ) {}

  get enabled(): boolean {
    return !!this.config.get('sportradar.enabled')
  }

  // ---- Sync (writes) ----------------------------------------------------

  async syncSchedule(): Promise<number> {
    const res = await this.client.get<any>('schedule:' + today(), `/schedules/${today()}/summaries.json`, 60)
    if (!res.data || !res.changed) return 0
    const summaries: any[] = res.data?.summaries ?? res.data?.sport_events ?? []
    let n = 0
    for (const s of summaries) {
      const ev = s.sport_event ?? s
      const competitors = ev?.competitors ?? []
      await this.events.save(
        this.events.create({
          id: ev.id,
          status: s.sport_event_status?.status ?? ev.status ?? 'not_started',
          scheduled: ev.start_time ? new Date(ev.start_time) : null,
          tournamentId: ev.sport_event_context?.competition?.id ?? null,
          homeName: competitors?.[0]?.name ?? null,
          awayName: competitors?.[1]?.name ?? null,
          isHistorical: (s.sport_event_status?.status ?? '') === 'closed',
          payload: s,
        }),
      )
      n++
    }
    this.log.log(`Synced ${n} scheduled events`)
    return n
  }

  async syncLiveSummaries(): Promise<number> {
    const live = await this.events.find({ where: { status: 'live' } })
    let n = 0
    for (const ev of live) {
      const res = await this.client.get<any>(`event:${ev.id}`, `/sport_events/${ev.id}/summary.json`, 3)
      if (res.data && res.changed) {
        ev.payload = res.data
        ev.status = res.data?.sport_event_status?.status ?? ev.status
        await this.events.save(ev)
        n++
      }
    }
    return n
  }

  async syncRankings(type: 'men' | 'women'): Promise<number> {
    const res = await this.client.get<any>(`rankings:${type}`, `/rankings.json`, 86400)
    if (!res.data || !res.changed) return 0
    const week = res.data?.generated_at?.slice(0, 10) ?? today()
    const list: any[] = res.data?.rankings?.[0]?.competitor_rankings ?? []
    let n = 0
    for (const r of list) {
      await this.rankings.save(
        this.rankings.create({
          rankingType: type,
          week,
          playerId: r.competitor?.id ?? String(r.rank),
          playerName: r.competitor?.name ?? 'Unknown',
          rank: r.rank,
          points: r.points ?? 0,
        }),
      )
      n++
    }
    return n
  }

  // ---- Read models (no origin calls) ------------------------------------

  getLive() {
    return this.events.find({ where: { status: 'live' } })
  }

  getSchedule() {
    return this.events.find({ order: { scheduled: 'ASC' }, take: 100 })
  }

  getRankings(type: string) {
    return this.rankings.find({ where: { rankingType: type }, order: { rank: 'ASC' }, take: 50 })
  }

  status() {
    return {
      enabled: this.enabled,
      baseUrl: this.config.get('sportradar.baseUrl'),
      note: this.enabled
        ? 'Sync active.'
        : 'Sportradar disabled (set SPORTRADAR_API_KEY and SPORTRADAR_ENABLED=true). Read models serve locally cached data.',
    }
  }
}
