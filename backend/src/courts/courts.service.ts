import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Court } from './court.entity'
import { PairingService } from '../pairing/pairing.service'
import { Match } from '../matches/match.entity'

export const COURT_COUNT = 6

@Injectable()
export class CourtsService implements OnModuleInit {
  private readonly log = new Logger('CourtsService')

  constructor(
    @InjectRepository(Court) private readonly courts: Repository<Court>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    private readonly pairing: PairingService,
  ) {}

  // Requirement 1: seed exactly 6 courts, each with an initial pairing code.
  async onModuleInit() {
    for (let id = 1; id <= COURT_COUNT; id++) {
      let court = await this.courts.findOne({ where: { id } })
      if (!court) {
        court = await this.courts.save(
          this.courts.create({ id, name: `Court ${id}`, status: 'IDLE' }),
        )
      }
      const code = await this.pairing.getActiveCode(id)
      if (!code) await this.pairing.generateCode(id, 'startup')
    }
    this.log.log(`Seeded ${COURT_COUNT} courts`)
  }

  findAll() {
    return this.courts.find({ order: { id: 'ASC' } })
  }

  findOne(id: number) {
    return this.courts.findOne({ where: { id } })
  }

  async getState(id: number) {
    const court = await this.courts.findOne({ where: { id } })
    if (!court) return null
    const code = await this.pairing.getActiveCode(id)
    const match = court.currentMatchId
      ? await this.matches.findOne({ where: { id: court.currentMatchId } })
      : null
    return {
      court,
      pairing: code ? { code: code.code, expiresAt: code.expiresAt } : null,
      match,
    }
  }

  async setStatus(id: number, status: Court['status']) {
    await this.courts.update({ id }, { status })
  }

  /** Admin/operator reset: abandon match, revoke sessions, rotate code, IDLE. */
  async reset(id: number) {
    const court = await this.courts.findOne({ where: { id } })
    if (!court) return
    if (court.currentMatchId) {
      await this.matches.update({ id: court.currentMatchId }, { status: 'ABANDONED' })
    }
    await this.pairing.revokeSessionsForCourt(id)
    court.status = 'IDLE'
    court.currentMatchId = null
    await this.courts.save(court)
    await this.pairing.generateCode(id, 'reset')
  }
}
