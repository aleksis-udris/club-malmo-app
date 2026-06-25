import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SportradarService } from './sportradar.service'

/**
 * Tiered sync jobs with the spec's refresh intervals, plus an immediate sync on
 * startup so data appears right away (instead of waiting for the next cron tick).
 * Each is a no-op when the integration is disabled.
 */
@Injectable()
export class SyncScheduler implements OnApplicationBootstrap {
  private readonly log = new Logger('SyncScheduler')

  constructor(private readonly sr: SportradarService) {}

  onApplicationBootstrap() {
    if (!this.sr.enabled) {
      this.log.log('Sportradar disabled — skipping initial sync (set key + enable, then restart).')
      return
    }
    // Run in the background so the HTTP server starts listening immediately.
    this.log.log('Running initial Sportradar sync in background…')
    this.sr
      .runAll()
      .then((summary) => this.log.log(`Initial sync result: ${JSON.stringify(summary)}`))
      .catch((e) => this.log.warn(`initial sync failed: ${e?.message ?? e}`))
  }

  @Cron('*/2 * * * *') // every 2 minutes (budget-friendly)
  async liveScores() {
    if (!this.sr.enabled) return
    await this.sr.syncLiveSummaries().catch((e) => this.log.warn(`live sync: ${e?.message ?? e}`))
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async schedule() {
    if (!this.sr.enabled) return
    await this.sr.syncSchedule().catch((e) => this.log.warn(`schedule sync: ${e?.message ?? e}`))
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async standings() {
    if (!this.sr.enabled) return
    await this.sr.syncStandings().catch((e) => this.log.warn(`standings sync: ${e?.message ?? e}`))
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async reference() {
    if (!this.sr.enabled) return
    // Squash v2 has no rankings endpoint; competitors + event calendar only.
    await this.sr.syncCompetitors().catch((e) => this.log.warn(`competitors sync: ${e?.message ?? e}`))
    await this.sr.syncCalendar().catch((e) => this.log.warn(`calendar sync: ${e?.message ?? e}`))
  }
}
