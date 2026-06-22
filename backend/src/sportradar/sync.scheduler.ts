import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SportradarService } from './sportradar.service'

/**
 * Tiered sync jobs with the spec's refresh intervals. Each is a no-op when the
 * integration is disabled, so the app runs without a Sportradar key.
 */
@Injectable()
export class SyncScheduler {
  private readonly log = new Logger('SyncScheduler')

  constructor(private readonly sr: SportradarService) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async liveScores() {
    if (!this.sr.enabled) return
    await this.sr.syncLiveSummaries()
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async schedule() {
    if (!this.sr.enabled) return
    await this.sr.syncSchedule()
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async rankings() {
    if (!this.sr.enabled) return
    await this.sr.syncRankings('men')
    await this.sr.syncRankings('women')
  }
}
