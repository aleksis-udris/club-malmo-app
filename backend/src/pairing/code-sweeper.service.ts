import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PairingService } from './pairing.service'
import { CourtsService } from '../courts/courts.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'

/**
 * Single-authority TTL sweeper (spec §6.2). Every 30s it expires stale sessions
 * and regenerates expired codes for non-LIVE courts, broadcasting new codes/state.
 */
@Injectable()
export class CodeSweeperService {
  private readonly log = new Logger('CodeSweeper')

  constructor(
    private readonly pairing: PairingService,
    private readonly courts: CourtsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async sweep() {
    const affected = await this.pairing.sweep()
    for (const courtId of affected) {
      const state = await this.courts.getState(courtId)
      if (state?.pairing) this.realtime.emitPairingCode(courtId, state.pairing.code, state.pairing.expiresAt)
      this.realtime.emitCourtState(courtId, state)
    }
    if (affected.length) this.log.debug(`Regenerated codes for courts: ${affected.join(', ')}`)
  }
}
