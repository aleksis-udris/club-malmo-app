import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SportradarClient } from './sportradar.client'
import { SrEvent } from './entities/sr-event.entity'
import { SrRanking } from './entities/sr-ranking.entity'
import { SrStanding } from './entities/sr-standing.entity'
import { SrCompetitor } from './entities/sr-competitor.entity'
import { SrCalendarEvent } from './entities/sr-calendar.entity'

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 3-letter (IOC/FIFA, as Sportradar uses) -> ISO-2 for flag emoji. Broad coverage;
// anything not here renders as the country code initials instead of a blank flag.
const A3: Record<string, string> = {
  SWE: "SE",
  ENG: "GB",
  GBR: "GB",
  GER: "DE",
  DEU: "DE",
  FRA: "FR",
  ESP: "ES",
  NED: "NL",
  NLD: "NL",
  SUI: "CH",
  CHE: "CH",
  BEL: "BE",
  ITA: "IT",
  AUT: "AT",
  WAL: "GB",
  SCO: "GB",
  FIN: "FI",
  NOR: "NO",
  DEN: "DK",
  DNK: "DK",
  POL: "PL",
  EGY: "EG",
  USA: "US",
  IND: "IN",
  MAS: "MY",
  HKG: "HK",
  QAT: "QA",
  NZL: "NZ",
};
function flag(code?: string | null): string {
  if (!code) return "🏳️";
  let cc = code.toUpperCase();
  if (cc.length === 3) cc = A3[cc] ?? "";
  if (cc.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...[...cc].map((ch) => 0x1f1e6 + (ch.charCodeAt(0) - 65)),
  );
}
const country = (name: string, code?: string | null) => ({
  code: (code ?? name.slice(0, 3)).toUpperCase(),
  name,
  flag: flag(code),
});

/**
 * Sportradar Squash **v2** integration. Syncs schedules, live summaries, season
 * standings, competitors and rankings into the local mirror, and exposes read
 * models already shaped for the frontend. All sync no-ops when disabled (no key);
 * read models then return empty — the app shows only data that came from the API.
 */
@Injectable()
export class SportradarService {
  private readonly log = new Logger("SportradarService");

  constructor(
    private readonly client: SportradarClient,
    private readonly config: ConfigService,
    @InjectRepository(SrEvent) private readonly events: Repository<SrEvent>,
    @InjectRepository(SrRanking) private readonly rankings: Repository<SrRanking>,
    @InjectRepository(SrStanding) private readonly standings: Repository<SrStanding>,
    @InjectRepository(SrCompetitor) private readonly competitors: Repository<SrCompetitor>,
    @InjectRepository(SrCalendarEvent) private readonly calendar: Repository<SrCalendarEvent>,
  ) {}

  get enabled(): boolean {
    return !!this.config.get("sportradar.enabled");
  }
  private cachedSeasonId: string | null = null
  private seasonsCache: any[] | null = null

  /**
   * Season list, newest first. Squash v2 documents seasons PER competition
   * (/competitions/{id}/seasons.json); there is no reliable global /seasons.json,
   * so this tries the configured competition first, then the global list, and
   * degrades to [] on failure — callers then derive seasons from synced matches.
   */
  private async listSeasons(): Promise<any[]> {
    if (this.seasonsCache) return this.seasonsCache
    const competitionId = this.config.get<string>('sportradar.competitionId') ?? ''
    const path = competitionId ? `/competitions/${competitionId}/seasons.json` : `/seasons.json`
    try {
      const res = await this.client.get<any>('seasons:list', path, 86400)
      const seasons: any[] = (res.data?.seasons ?? []).slice()
      seasons.sort(
        (a: any, b: any) =>
          new Date(b.start_date ?? 0).getTime() - new Date(a.start_date ?? 0).getTime(),
      )
      this.seasonsCache = seasons
      return seasons
    } catch (e: any) {
      this.log.debug(`listSeasons (${path}) unavailable: ${e?.response?.status ?? e?.message}`)
      this.seasonsCache = []
      return []
    }
  }

  /** Distinct seasons extracted from already-synced matches (sport_event_context). */
  private async seasonsFromMatches(): Promise<any[]> {
    const events = await this.events.find({ order: { scheduled: 'DESC' }, take: 500 })
    const map = new Map<string, any>()
    for (const e of events) {
      const ctx = (e.payload as any)?.sport_event?.sport_event_context ?? {}
      const se = ctx.season
      if (se?.id && !map.has(se.id)) {
        map.set(se.id, {
          id: se.id,
          name: se.name,
          start_date: se.start_date ?? null,
          end_date: se.end_date ?? null,
          competition_id: ctx.competition?.id ?? se.competition_id ?? null,
          competition: ctx.competition ?? null,
          venue: (e.payload as any)?.sport_event?.venue ?? null,
        })
      }
    }
    return [...map.values()]
  }

  /**
   * Season to use: SPORTRADAR_SEASON_ID if set, else the season covering today
   * (or the most recent). Falls back to the season carried by a recent match.
   */
  async resolveSeasonId(): Promise<string> {
    const configured = this.config.get<string>('sportradar.seasonId') ?? ''
    if (configured) return configured
    if (this.cachedSeasonId) return this.cachedSeasonId
    const seasons = await this.listSeasons()
    const now = Date.now()
    const within = (se: any) => {
      const start = se.start_date ? new Date(se.start_date).getTime() : 0
      const end = se.end_date ? new Date(se.end_date).getTime() : Number.POSITIVE_INFINITY
      return start <= now && now <= end
    }
    let chosen = seasons.find(within) ?? seasons[0]
    if (!chosen) chosen = (await this.seasonsFromMatches())[0]
    this.cachedSeasonId = chosen?.id ?? ''
    if (this.cachedSeasonId)
      this.log.log(`Selected season: ${chosen?.name ?? '?'} (${this.cachedSeasonId})`)
    return this.cachedSeasonId ?? ''
  }

  /** Current season then previous ones; uses match-derived seasons if no list. */
  private async seasonsFromCurrent(): Promise<any[]> {
    const seasons = await this.listSeasons()
    const currentId = await this.resolveSeasonId()
    if (!seasons.length) {
      const fromMatches = await this.seasonsFromMatches()
      if (fromMatches.length) return fromMatches
      return currentId ? [{ id: currentId }] : []
    }
    const idx = seasons.findIndex((se) => se.id === currentId)
    return idx >= 0 ? seasons.slice(idx) : seasons
  }

  /* ---- Sync (writes) — v2 endpoints --------------------------------- */

  async syncSchedule(): Promise<number> {
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = ymd(d)
      const res = await this.client.get<any>(`schedule:${date}`, `/schedules/${date}/summaries.json`, 60)
      if (!res.data) continue
      const summaries: any[] = res.data?.summaries ?? []
      for (const s of summaries) n += (await this.upsertEvent(s)) ? 1 : 0
    }
    // Fallback: no recent matches at all -> load the most recent season that has a schedule.
    if ((await this.events.count()) === 0) {
      const seasons = await this.seasonsFromCurrent()
      for (let i = 0; i < Math.min(seasons.length, 3); i++) {
        const m = await this.fetchSeasonSchedule(seasons[i].id)
        if (m > 0) {
          if (i > 0)
            this.log.log(`No recent matches; using previous season ${seasons[i].name ?? seasons[i].id} (${m})`)
          n += m
          break
        }
      }
    }
    return n
  }

  private async fetchSeasonSchedule(seasonId: string): Promise<number> {
    if (!seasonId) return 0
    const res = await this.client.get<any>(
      `season-schedule:${seasonId}`,
      `/seasons/${seasonId}/schedules.json`,
      3600,
    )
    if (!res.data) return 0
    const summaries: any[] = res.data?.summaries ?? res.data?.schedules ?? []
    let n = 0
    for (const s of summaries) n += (await this.upsertEvent(s)) ? 1 : 0
    return n
  }

  async syncLiveSummaries(): Promise<number> {
    const res = await this.client.get<any>('schedule:live', `/schedules/live/summaries.json`, 5)
    if (!res.data) return 0
    const summaries: any[] = res.data?.summaries ?? []
    let n = 0
    for (const s of summaries) n += (await this.upsertEvent(s)) ? 1 : 0
    return n
  }

  private async upsertEvent(s: any): Promise<boolean> {
    const ev = s.sport_event ?? s;
    if (!ev?.id) return false;
    const comp = ev.competitors ?? [];
    const st = s.sport_event_status ?? {};
    await this.events.save(
      this.events.create({
        id: ev.id,
        status: st.status ?? ev.status ?? "not_started",
        scheduled: ev.start_time ? new Date(ev.start_time) : null,
        tournamentId: ev.sport_event_context?.competition?.id ?? null,
        homeName: comp?.[0]?.name ?? null,
        awayName: comp?.[1]?.name ?? null,
        isHistorical: (st.status ?? "") === "closed",
        payload: s,
      }),
    );
    return true;
  }

  async syncStandings(): Promise<number> {
    const seasons = await this.seasonsFromCurrent()
    for (let i = 0; i < Math.min(seasons.length, 3); i++) {
      const rows = await this.fetchStandingRows(seasons[i].id)
      if (rows.length) {
        // Replace only once we actually have data (never wipe on a failed fetch).
        await this.standings.clear()
        await this.standings.save(rows)
        if (i > 0)
          this.log.log(
            `Standings empty for current season; using previous season ${seasons[i].name ?? seasons[i].id} (${rows.length} rows)`,
          )
        return rows.length
      }
    }
    return 0 // keep whatever standings already exist
  }

  private async fetchStandingRows(seasonId: string): Promise<SrStanding[]> {
    if (!seasonId) return []
    const res = await this.client.get<any>(`standings:${seasonId}`, `/seasons/${seasonId}/standings.json`, 3600)
    if (!res.data) return []
    // Squash v2 shape: season_standings[].groups[].standings[] (also tolerate flat).
    const seasonStandings: any[] = res.data?.season_standings ?? res.data?.standings ?? []
    const raw: any[] = []
    for (const ss of seasonStandings) {
      raw.push(...(ss.standings ?? ss.competitor_standings ?? []))
      for (const grp of ss.groups ?? []) {
        raw.push(...(grp.standings ?? grp.competitor_standings ?? []))
      }
    }
    return raw.map((row) => {
      const cmp = row.competitor ?? {}
      const won = row.win ?? row.won ?? 0
      return this.standings.create({
        seasonId,
        competitorId: cmp.id ?? String(row.rank),
        competitorName: cmp.name ?? 'Unknown',
        countryCode: cmp.country_code ?? null,
        rank: row.rank ?? 0,
        played: row.played ?? 0,
        won,
        lost: row.loss ?? row.lost ?? 0,
        points: row.points ?? won * 3,
      })
    })
  }

  async syncCompetitors(): Promise<number> {
    const seasons = await this.seasonsFromCurrent()
    for (let i = 0; i < Math.min(seasons.length, 3); i++) {
      const rows = await this.fetchCompetitorRows(seasons[i].id)
      if (rows.length) {
        await this.competitors.clear()
        await this.competitors.save(rows)
        if (i > 0)
          this.log.log(
            `Competitors empty for current season; using previous season ${seasons[i].name ?? seasons[i].id} (${rows.length})`,
          )
        return rows.length
      }
    }
    return 0 // keep whatever competitors already exist
  }

  private async fetchCompetitorRows(seasonId: string): Promise<SrCompetitor[]> {
    if (!seasonId) return []
    const res = await this.client.get<any>(`competitors:${seasonId}`, `/seasons/${seasonId}/competitors.json`, 86400)
    if (!res.data) return []
    const list: any[] = res.data?.season_competitors ?? res.data?.competitors ?? []
    return list.map((cmp) =>
      this.competitors.create({
        id: cmp.id,
        name: cmp.name,
        country: cmp.country ?? null,
        countryCode: cmp.country_code ?? null,
        gender: cmp.gender ?? null,
        played: 0,
        payload: cmp,
      }),
    )
  }

  /** Build the event calendar from competitions (gender/country) + seasons (dates). */
  async syncCalendar(): Promise<number> {
    let comps: any[] = []
    try {
      const compRes = await this.client.get<any>('competitions', '/competitions.json', 86400)
      comps = compRes.data?.competitions ?? []
    } catch (e: any) {
      this.log.debug(`competitions unavailable: ${e?.response?.status ?? e?.message}`)
    }
    const compMap = new Map<string, any>(comps.map((c) => [c.id, c]))

    // Prefer the seasons list; if unavailable, derive events from synced matches.
    let seasons = await this.listSeasons()
    if (!seasons.length) seasons = await this.seasonsFromMatches()
    if (!seasons.length) return 0

    // Best-effort venue per competition from any synced match.
    const events = await this.events.find({ take: 1000 })
    const venueByComp = new Map<string, string>()
    for (const e of events) {
      const v = (e.payload as any)?.sport_event?.venue
      const name = [v?.name, v?.city_name ?? v?.city].filter(Boolean).join(', ')
      if (e.tournamentId && name && !venueByComp.has(e.tournamentId)) {
        venueByComp.set(e.tournamentId, name)
      }
    }

    const rows = seasons.map((se) => {
      const comp = compMap.get(se.competition_id) ?? se.competition ?? {}
      const cat = comp.category ?? {}
      const cc = cat.country_code ?? null
      const seVenue = se.venue
        ? [se.venue.name, se.venue.city_name ?? se.venue.city].filter(Boolean).join(', ')
        : null
      const venue = venueByComp.get(se.competition_id) ?? seVenue
      const hay = `${cat.name ?? ''} ${venue ?? ''} ${se.name ?? ''}`
      const isSweden = (cc ?? '').toUpperCase().startsWith('SW') || /sweden|malm/i.test(hay)
      return this.calendar.create({
        id: se.id,
        name: se.name,
        gender: comp.gender ?? null,
        countryCode: cc,
        countryName: cat.name ?? null,
        startDate: se.start_date ?? null,
        endDate: se.end_date ?? null,
        venue,
        isSweden,
      })
    })
    await this.calendar.clear()
    await this.calendar.save(rows)
    return rows.length
  }

  async syncRankings(type: 'men' | 'women'): Promise<number> {
    let res: any
    try {
      res = await this.client.get<any>(`rankings:${type}`, `/rankings.json`, 86400)
    } catch (e: any) {
      // Rankings are optional and not offered on every squash plan (often 404).
      this.log.debug(`rankings (${type}) unavailable: ${e?.response?.status ?? e?.message}`)
      return 0
    }
    if (!res.data || !res.changed) return 0
    const week = res.data?.generated_at?.slice(0, 10) ?? ymd(new Date())
    const list: any[] = res.data?.rankings?.[0]?.competitor_rankings ?? []
    let n = 0
    for (const r of list) {
      await this.rankings.save(
        this.rankings.create({
          rankingType: type,
          week,
          playerId: r.competitor?.id ?? String(r.rank),
          playerName: r.competitor?.name ?? "Unknown",
          rank: r.rank,
          points: r.points ?? 0,
        }),
      );
      n++;
    }
    return n;
  }

  /**
   * Force-run every sync once and return a per-endpoint summary (counts or the
   * error). Used at startup and by GET /sportradar/sync for debugging — this is
   * the quickest way to see WHY there is no data (e.g. a 403 means the key or the
   * access level in SPORTRADAR_BASE_URL is wrong).
   */
  async runAll(): Promise<Record<string, unknown>> {
    if (!this.enabled) {
      return {
        enabled: false,
        hint: 'Sportradar disabled. Set SPORTRADAR_API_KEY + SPORTRADAR_ENABLED=true in backend/.env and RESTART the backend (watch mode does not reload .env).',
      }
    }
    const out: Record<string, unknown> = { enabled: true }
    out.baseUrl = this.config.get('sportradar.baseUrl')
    try {
      out.seasonId = (await this.resolveSeasonId()) || '(none found)'
    } catch (e: any) {
      out.seasonId = `error: ${e?.response?.status ?? ''} ${e?.message ?? e}`
    }
    const run = async (name: string, fn: () => Promise<number>) => {
      try {
        out[name] = await fn()
      } catch (e: any) {
        out[name] = `error: ${e?.response?.status ?? ''} ${e?.message ?? e}`
      }
    }
    await run('competitors', () => this.syncCompetitors())
    await run('calendar', () => this.syncCalendar())
    await run('schedule', () => this.syncSchedule())
    await run('live', () => this.syncLiveSummaries())
    await run('standings', () => this.syncStandings())
    return out
  }

  /* ---- Read models shaped for the frontend (no origin calls) -------- */

  private toMatch(e: SrEvent) {
    const st = (e.payload as any)?.sport_event_status ?? {};
    const comp = (e.payload as any)?.sport_event?.competitors ?? [];
    const status =
      e.status === "closed"
        ? "finished"
        : e.status === "live"
          ? "live"
          : "upcoming";
    const score =
      st.home_score != null && st.away_score != null
        ? `${st.home_score}-${st.away_score}`
        : "";
    return {
      id: e.id,
      time: e.scheduled ? new Date(e.scheduled).toISOString().slice(11, 16) : '',
      draw: (e.payload as any)?.sport_event?.sport_event_context?.competition?.name ?? '',
      home: country(e.homeName ?? comp?.[0]?.name ?? 'Team 1', comp?.[0]?.country_code),
      away: country(e.awayName ?? comp?.[1]?.name ?? 'Team 2', comp?.[1]?.country_code),
      score,
      court: (e.payload as any)?.sport_event?.venue?.name ?? "",
      status,
    };
  }

  /**
   * Priority of a match: 3 = a Swedish player is competing, 2 = hosted in
   * Sweden/Malmö, 1 = nearby region (host or player), 0 = else.
   */
  private eventPriority(e: SrEvent): number {
    const ev = (e.payload as any)?.sport_event ?? {}
    const v = ev.venue ?? {}
    const hostHay = `${v.country ?? ''} ${v.city_name ?? v.city ?? ''} ${v.name ?? ''}`
    let p = regionPriority(v.country_code, hostHay)
    for (const c of ev.competitors ?? []) {
      const cp = regionPriority(c.country_code, c.country)
      if (cp === 2) p = Math.max(p, 3)
      else if (cp === 1) p = Math.max(p, 1)
    }
    return p
  }

  /** Season ids in which a Swedish player has competed (from synced matches). */
  private async swedishSeasonIds(): Promise<Set<string>> {
    const events = await this.events.find({ take: 1000 })
    const set = new Set<string>()
    for (const e of events) {
      const ev = (e.payload as any)?.sport_event ?? {}
      const hasSwe = (ev.competitors ?? []).some(
        (c: any) => regionPriority(c.country_code, c.country) === 2,
      )
      const sid = ev.sport_event_context?.season?.id
      if (hasSwe && sid) set.add(sid)
    }
    return set
  }

  async getMatchDays() {
    const rows = await this.events.find({ order: { scheduled: 'DESC' }, take: 200 })
    const byDay = new Map<string, SrEvent[]>()
    for (const e of rows) {
      const day = e.scheduled ? ymd(new Date(e.scheduled)) : 'unknown'
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day)!.push(e)
    }
    const today = ymd(new Date())
    // Requirement: within each day, surface Sweden / Malmö events first.
    return [...byDay.entries()].slice(0, 4).map(([date, evs]) => {
      evs.sort((a, b) => this.eventPriority(b) - this.eventPriority(a))
      return {
        date,
        label: date === today ? 'Today' : date,
        matches: evs.map((e) => this.toMatch(e)),
      }
    })
  }

  private toStanding(s: SrStanding) {
    return {
      position: s.rank,
      country: country(s.competitorName, s.countryCode),
      played: s.played,
      won: s.won,
      draws: 0,
      lost: s.lost,
      rubbers: "",
      games: "",
      points: s.points,
    };
  }

  /**
   * Build a standings/ranking table from synced match results (wins/losses per
   * player). Squash is individual knockout tournaments with no league table in the
   * feed, so this derives one from the matches we already have.
   */
  /** Per-competitor tally (played/won/lost/games) derived from synced matches. */
  private async competitorStats() {
    const events = await this.events.find({ take: 1000 })
    const tbl = new Map<
      string,
      {
        name: string
        code: string | null
        played: number
        won: number
        lost: number
        gamesWon: number
        gamesLost: number
      }
    >()
    const touch = (id: string, name: string, code: string | null) => {
      let r = tbl.get(id)
      if (!r) {
        r = { name, code, played: 0, won: 0, lost: 0, gamesWon: 0, gamesLost: 0 }
        tbl.set(id, r)
      }
      return r
    }
    for (const e of events) {
      const st = (e.payload as any)?.sport_event_status ?? {}
      if (st.status !== 'closed') continue
      const comp = (e.payload as any)?.sport_event?.competitors ?? []
      const h = comp?.[0]
      const a = comp?.[1]
      if (!h || !a || st.home_score == null || st.away_score == null) continue
      const hr = touch(h.id ?? h.name, h.name ?? 'Team 1', h.country_code ?? null)
      const ar = touch(a.id ?? a.name, a.name ?? 'Team 2', a.country_code ?? null)
      hr.played++
      ar.played++
      hr.gamesWon += st.home_score
      hr.gamesLost += st.away_score
      ar.gamesWon += st.away_score
      ar.gamesLost += st.home_score
      if (st.home_score > st.away_score) {
        hr.won++
        ar.lost++
      } else {
        ar.won++
        hr.lost++
      }
    }
    return tbl
  }

  private async computeStandings() {
    const tbl = await this.competitorStats()
    return [...tbl.values()]
      .sort((x, y) => y.won - x.won || x.lost - y.lost || y.played - x.played)
      .map((r, i) => ({
        position: i + 1,
        country: country(r.name, r.code),
        played: r.played,
        won: r.won,
        draws: 0,
        lost: r.lost,
        rubbers: `${r.won}-${r.lost}`,
        games: `${r.gamesWon}-${r.gamesLost}`,
        points: r.won * 3,
      }))
  }

  private async standingsRows() {
    const stored = (await this.standings.find({ order: { rank: 'ASC' } })).map((s) =>
      this.toStanding(s),
    )
    const computed = await this.computeStandings()
    // Use whichever source has more rows so positions 9-16 are populated when a
    // season's official table is only a single 8-player pool.
    return computed.length > stored.length ? computed : stored
  }

  async getStandings(bracket: 'top' | 'bottom') {
    const rows = await this.standingsRows()
    return rows.filter((r) => (bracket === 'bottom' ? r.position > 8 : r.position <= 8))
  }

  async getLatest(_bracket: 'top' | 'bottom') {
    const rows = await this.events.find({ where: { status: 'closed' }, order: { scheduled: 'DESC' }, take: 60 })
    rows.sort(
      (a, b) =>
        this.eventPriority(b) - this.eventPriority(a) ||
        (b.scheduled?.getTime() ?? 0) - (a.scheduled?.getTime() ?? 0),
    )
    return rows.slice(0, 6).map((e) => this.toMatch(e))
  }

  /** Event calendar: all squash tournaments with dates, gender, venue & host country. */
  async getCalendar() {
    const all = await this.calendar.find()
    const swePlaying = await this.swedishSeasonIds()
    return all
      .map((c) => {
        const hostP = regionPriority(
          c.countryCode,
          `${c.countryName ?? ''} ${c.venue ?? ''} ${c.name ?? ''}`,
        )
        const priority = swePlaying.has(c.id) ? 3 : hostP
        return {
          id: c.id,
          name: c.name,
          gender: c.gender,
          dateFrom: c.startDate,
          dateTo: c.endDate,
          country: country(c.countryName ?? c.countryCode ?? '', c.countryCode),
          venue: c.venue,
          isSweden: priority >= 2,
          swedenPlaying: priority === 3,
          nearby: priority === 1,
          priority,
        }
      })
      .sort((a, b) => b.priority - a.priority || (b.dateFrom ?? '').localeCompare(a.dateFrom ?? ''))
  }

  /** Identity (name/country/gender) of every player seen in synced matches. */
  private async playersFromMatches() {
    const events = await this.events.find({ take: 1000 })
    const map = new Map<string, { name: string; code: string | null; country: string | null; gender: string | null }>()
    for (const e of events) {
      const ctx = (e.payload as any)?.sport_event?.sport_event_context ?? {}
      const gender = ctx.competition?.gender ?? null
      const comps = (e.payload as any)?.sport_event?.competitors ?? []
      for (const c of comps) {
        if (c?.id && !map.has(c.id)) {
          map.set(c.id, {
            name: c.name ?? 'Unknown',
            code: c.country_code ?? null,
            country: c.country ?? null,
            gender,
          })
        }
      }
    }
    return map
  }

  /**
   * Players view. Built from the matches we already have (each match carries its
   * competitors + the competition's gender), so it works even when the dedicated
   * season-competitors endpoint returns nothing. The SrCompetitor table (if synced)
   * is merged in for any extra players. Stats come from completed matches.
   */
  async getSweden() {
    const fromMatches = await this.playersFromMatches()
    const stats = await this.competitorStats()

    // Merge any synced competitor records (don't depend on them).
    for (const c of await this.competitors.find()) {
      if (!fromMatches.has(c.id)) {
        fromMatches.set(c.id, {
          name: c.name,
          code: c.countryCode,
          country: c.country,
          gender: c.gender ?? null,
        })
      }
    }

    const rankById = new Map<string, number>()
    ;[...stats.entries()]
      .sort(([, x], [, y]) => y.won - x.won || x.lost - y.lost || y.played - x.played)
      .forEach(([id], i) => rankById.set(id, i + 1))

    const players = [...fromMatches.entries()].map(([id, m]) => {
      const st = stats.get(id)
      const decided = (st?.won ?? 0) + (st?.lost ?? 0)
      return {
        id,
        name: m.name,
        country: country(m.country ?? m.code ?? '', m.code),
        gender: m.gender ?? null,
        played: st?.played ?? 0,
        won: st?.won ?? 0,
        lost: st?.lost ?? 0,
        games: st ? `${st.gamesWon}-${st.gamesLost}` : '0-0',
        winPct: decided ? Math.round(((st?.won ?? 0) / decided) * 100) : 0,
        rank: rankById.get(id) ?? null,
      }
    })

    const isFemale = (p: { gender: string | null }) => (p.gender ?? '').toLowerCase() === 'female'
    const byRank = (a: { rank: number | null; name: string }, b: { rank: number | null; name: string }) =>
      (a.rank ?? 1e9) - (b.rank ?? 1e9) || a.name.localeCompare(b.name)
    const women = players.filter(isFemale).sort(byRank)
    const men = players.filter((p) => !isFemale(p)).sort(byRank)

    // Sweden-only list (robust: 2- or 3-letter code, or country name).
    const isSwe = (p: { country: { code: string; name: string } }) => {
      const code = (p.country.code ?? '').toUpperCase()
      const name = (p.country.name ?? '').toLowerCase()
      return code === 'SE' || code.startsWith('SWE') || name === 'sweden'
    }
    const sweden = players.filter(isSwe).sort(byRank)

    // Diagnostic: which nationalities are actually present in the data.
    const countries: Record<string, number> = {}
    for (const p of players) {
      const k = p.country.name || p.country.code || '—'
      countries[k] = (countries[k] ?? 0) + 1
    }

    const groupStandings = (await this.standingsRows()).slice(0, 8)
    return {
      groupStandings,
      overallStats: [],
      men,
      women,
      sweden,
      countries,
      counts: { men: men.length, women: women.length, sweden: sweden.length },
    }
  }

  getLive() {
    return this.events.find({ where: { status: "live" } });
  }
  getRankings(type: string) {
    return this.rankings.find({
      where: { rankingType: type },
      order: { rank: "ASC" },
      take: 50,
    });
  }

  status() {
    return {
      enabled: this.enabled,
      version: "v2",
      baseUrl: this.config.get("sportradar.baseUrl"),
      seasonConfigured: !!(
        this.config.get<string>("sportradar.seasonId") ?? ""
      ),
      seasonMode:
        (this.config.get<string>("sportradar.seasonId") ?? "")
          ? "fixed"
          : "auto-detect current",
      note: this.enabled
        ? "Sportradar v2 sync active."
        : "Sportradar disabled — set SPORTRADAR_API_KEY + SPORTRADAR_ENABLED=true. The current season is auto-detected (override with SPORTRADAR_SEASON_ID). Read models serve only data already synced from the API.",
    };
  }
}
