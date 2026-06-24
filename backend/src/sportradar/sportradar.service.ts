import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SportradarClient } from "./sportradar.client";
import { SrEvent } from "./entities/sr-event.entity";
import { SrRanking } from "./entities/sr-ranking.entity";
import { SrStanding } from "./entities/sr-standing.entity";
import { SrCompetitor } from "./entities/sr-competitor.entity";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ISO-3 → ISO-2 for common squash nations (for flag emoji); fallback handled below.
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
    @InjectRepository(SrRanking)
    private readonly rankings: Repository<SrRanking>,
    @InjectRepository(SrStanding)
    private readonly standings: Repository<SrStanding>,
    @InjectRepository(SrCompetitor)
    private readonly competitors: Repository<SrCompetitor>,
  ) {}

  get enabled(): boolean {
    return !!this.config.get("sportradar.enabled");
  }
  private cachedSeasonId: string | null = null;

  /**
   * The season to use for standings/competitors. Uses SPORTRADAR_SEASON_ID if set,
   * otherwise auto-detects the CURRENT season from Sportradar: it lists seasons
   * (optionally for SPORTRADAR_COMPETITION_ID) and picks the one whose date range
   * contains today, falling back to the most recently started one. Cached in memory.
   */
  async resolveSeasonId(): Promise<string> {
    const configured = this.config.get<string>("sportradar.seasonId") ?? "";
    if (configured) return configured;
    if (this.cachedSeasonId) return this.cachedSeasonId;

    const competitionId =
      this.config.get<string>("sportradar.competitionId") ?? "";
    const path = competitionId
      ? `/competitions/${competitionId}/seasons`
      : `/seasons`;
    const res = await this.client.get<any>("seasons:list", path, 86400);
    const seasons: any[] = res.data?.seasons ?? [];
    if (!seasons.length) return "";

    const now = Date.now();
    const within = (se: any) => {
      const start = se.start_date ? new Date(se.start_date).getTime() : 0;
      const end = se.end_date
        ? new Date(se.end_date).getTime()
        : Number.POSITIVE_INFINITY;
      return start <= now && now <= end;
    };
    const byNewest = (a: any, b: any) =>
      new Date(b.start_date ?? 0).getTime() -
      new Date(a.start_date ?? 0).getTime();

    const chosen = seasons.find(within) ?? [...seasons].sort(byNewest)[0];
    this.cachedSeasonId = chosen?.id ?? "";
    if (this.cachedSeasonId)
      this.log.log(
        `Auto-selected current season: ${chosen?.name ?? "?"} (${this.cachedSeasonId})`,
      );
    return this.cachedSeasonId ?? "";
  }

  /* ---- Sync (writes) — v2 endpoints --------------------------------- */

  async syncSchedule(): Promise<number> {
    let n = 0;
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = ymd(d);
      const res = await this.client.get<any>(
        `schedule:${date}`,
        `/schedules/${date}/summaries`,
        60,
      );
      if (!res.data || !res.changed) continue;
      const summaries: any[] = res.data?.summaries ?? [];
      for (const s of summaries) n += (await this.upsertEvent(s)) ? 1 : 0;
    }
    return n;
  }

  async syncLiveSummaries(): Promise<number> {
    const res = await this.client.get<any>(
      "schedule:live",
      `/schedules/live/summaries`,
      5,
    );
    if (!res.data || !res.changed) return 0;
    const summaries: any[] = res.data?.summaries ?? [];
    let n = 0;
    for (const s of summaries) n += (await this.upsertEvent(s)) ? 1 : 0;
    return n;
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
    const seasonId = await this.resolveSeasonId();
    if (!seasonId) return 0;
    const res = await this.client.get<any>(
      `standings:${seasonId}`,
      `/seasons/${seasonId}/standings`,
      3600,
    );
    if (!res.data || !res.changed) return 0;
    const groups: any[] = res.data?.standings ?? [];
    let n = 0;
    for (const g of groups) {
      for (const row of g.competitor_standings ?? g.standings ?? []) {
        const cmp = row.competitor ?? {};
        await this.standings.save(
          this.standings.create({
            seasonId,
            competitorId: cmp.id ?? String(row.rank),
            competitorName: cmp.name ?? "Unknown",
            countryCode: cmp.country_code ?? null,
            rank: row.rank ?? 0,
            played: row.played ?? 0,
            won: row.win ?? row.won ?? 0,
            lost: row.loss ?? row.lost ?? 0,
            points: row.points ?? 0,
          }),
        );
        n++;
      }
    }
    return n;
  }

  async syncCompetitors(): Promise<number> {
    const seasonId = await this.resolveSeasonId();
    if (!seasonId) return 0;
    const res = await this.client.get<any>(
      `competitors:${seasonId}`,
      `/seasons/${seasonId}/competitors`,
      86400,
    );
    if (!res.data || !res.changed) return 0;
    const list: any[] =
      res.data?.season_competitors ?? res.data?.competitors ?? [];
    let n = 0;
    for (const cmp of list) {
      await this.competitors.save(
        this.competitors.create({
          id: cmp.id,
          name: cmp.name,
          country: cmp.country ?? null,
          countryCode: cmp.country_code ?? null,
          gender: cmp.gender ?? null,
          played: 0,
          payload: cmp,
        }),
      );
      n++;
    }
    return n;
  }

  async syncRankings(type: "men" | "women"): Promise<number> {
    const res = await this.client.get<any>(
      `rankings:${type}`,
      `/rankings`,
      86400,
    );
    if (!res.data || !res.changed) return 0;
    const week = res.data?.generated_at?.slice(0, 10) ?? ymd(new Date());
    const list: any[] = res.data?.rankings?.[0]?.competitor_rankings ?? [];
    let n = 0;
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
      time: e.scheduled
        ? new Date(e.scheduled).toISOString().slice(11, 16)
        : "",
      draw:
        (e.payload as any)?.sport_event?.sport_event_context?.competition
          ?.name ?? "",
      home: country(
        e.homeName ?? comp?.[0]?.name ?? "Home",
        comp?.[0]?.country_code,
      ),
      away: country(
        e.awayName ?? comp?.[1]?.name ?? "Away",
        comp?.[1]?.country_code,
      ),
      score,
      court: (e.payload as any)?.sport_event?.venue?.name ?? "",
      status,
    };
  }

  async getMatchDays() {
    const rows = await this.events.find({
      order: { scheduled: "DESC" },
      take: 200,
    });
    const byDay = new Map<string, ReturnType<typeof this.toMatch>[]>();
    for (const e of rows) {
      const day = e.scheduled ? ymd(new Date(e.scheduled)) : "unknown";
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(this.toMatch(e));
    }
    const today = ymd(new Date());
    return [...byDay.entries()].slice(0, 4).map(([date, matches]) => ({
      date,
      label: date === today ? "Today" : date,
      matches,
    }));
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

  async getStandings(bracket: "top" | "bottom") {
    const all = await this.standings.find({ order: { rank: "ASC" } });
    return all
      .filter((s) => (bracket === "bottom" ? s.rank > 8 : s.rank <= 8))
      .map((s) => this.toStanding(s));
  }

  async getLatest(_bracket: "top" | "bottom") {
    const rows = await this.events.find({
      where: { status: "closed" },
      order: { scheduled: "DESC" },
      take: 6,
    });
    return rows.map((e) => this.toMatch(e));
  }

  async getSweden() {
    const all = await this.competitors.find();
    const swedes = all.filter(
      (c) =>
        c.country === "Sweden" ||
        (c.countryCode ?? "").toUpperCase().startsWith("SWE"),
    );
    const men = swedes
      .filter((c) => c.gender !== "female")
      .map((c) => ({ id: c.id, name: c.name, played: c.played }));
    const women = swedes
      .filter((c) => c.gender === "female")
      .map((c) => ({ id: c.id, name: c.name, played: c.played }));
    const groupStandings = (
      await this.standings.find({ order: { rank: "ASC" } })
    )
      .filter((s) => (s.countryCode ?? "").toUpperCase().startsWith("SWE"))
      .map((s) => this.toStanding(s));
    return {
      groupStandings,
      overallStats: [],
      men,
      women,
      counts: { men: men.length, women: women.length },
    };
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
