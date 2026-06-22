import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createHash, randomBytes, randomInt } from 'crypto'
import { PairingCode } from './pairing-code.entity'
import { PairingSession } from './pairing-session.entity'
import { Court } from '../courts/court.entity'

export const CODE_TTL_MS = 10 * 60 * 1000 // requirement 4
export const SESSION_TTL_MS = 4 * 60 * 60 * 1000

export type ClaimError = 'CODE_NOT_FOUND' | 'CODE_EXPIRED' | 'COURT_BUSY' | 'COURT_LIVE_LOCKED'
export interface ClaimResult {
  ok: boolean
  error?: ClaimError
  token?: string
  courtId?: number
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

@Injectable()
export class PairingService {
  private readonly log = new Logger('PairingService')

  constructor(
    @InjectRepository(PairingCode) private readonly codes: Repository<PairingCode>,
    @InjectRepository(PairingSession) private readonly sessions: Repository<PairingSession>,
    @InjectRepository(Court) private readonly courts: Repository<Court>,
  ) {}

  async getActiveCode(courtId: number): Promise<PairingCode | null> {
    return this.codes.findOne({ where: { courtId, isActive: true } })
  }

  /** Requirement 6: generate a 6-digit code unique across all ACTIVE codes. */
  async generateCode(courtId: number, reason: string): Promise<PairingCode> {
    const active = await this.codes.find({ where: { isActive: true } })
    const taken = new Set(active.filter((c) => c.courtId !== courtId).map((c) => c.code))
    let code = ''
    for (let i = 0; i < 50; i++) {
      const candidate = String(randomInt(0, 1_000_000)).padStart(6, '0')
      if (!taken.has(candidate)) {
        code = candidate
        break
      }
    }
    // retire any existing active code for this court
    await this.codes.update({ courtId, isActive: true }, { isActive: false })
    const entity = this.codes.create({
      courtId,
      code,
      isActive: true,
      reason,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    })
    return this.codes.save(entity)
  }

  /** Requirement 3 & 7: claim a court by code; returns a court-scoped token. */
  async claim(rawCode: string, label?: string, deviceId?: string): Promise<ClaimResult> {
    const code = (rawCode ?? '').trim()
    if (!/^\d{6}$/.test(code)) return { ok: false, error: 'CODE_NOT_FOUND' }

    const row = await this.codes.findOne({ where: { code, isActive: true } })
    if (!row) return { ok: false, error: 'CODE_NOT_FOUND' }
    if (row.expiresAt.getTime() < Date.now()) return { ok: false, error: 'CODE_EXPIRED' }

    const court = await this.courts.findOne({ where: { id: row.courtId } })
    if (!court) return { ok: false, error: 'CODE_NOT_FOUND' }

    const activeSession = await this.sessions.findOne({
      where: { courtId: court.id, status: 'ACTIVE' },
    })
    if (activeSession) {
      return { ok: false, error: court.status === 'LIVE' ? 'COURT_LIVE_LOCKED' : 'COURT_BUSY' }
    }

    const token = randomBytes(32).toString('base64url')
    await this.sessions.save(
      this.sessions.create({
        courtId: court.id,
        tokenHash: sha256(token),
        deviceId: deviceId ?? null,
        label: label ?? null,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      }),
    )
    court.status = 'PAIRED'
    await this.courts.save(court)
    return { ok: true, token, courtId: court.id }
  }

  /** Validate a court-scoped pairing token. */
  async validate(courtId: number, token: string): Promise<PairingSession | null> {
    if (!token) return null
    const session = await this.sessions.findOne({
      where: { courtId, tokenHash: sha256(token), status: 'ACTIVE' },
    })
    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      session.status = 'EXPIRED'
      await this.sessions.save(session)
      return null
    }
    return session
  }

  async revokeSessionsForCourt(courtId: number): Promise<void> {
    await this.sessions.update({ courtId, status: 'ACTIVE' }, { status: 'REVOKED' })
  }

  async disconnect(courtId: number, token: string): Promise<void> {
    const session = await this.validate(courtId, token)
    if (!session) return
    session.status = 'REVOKED'
    await this.sessions.save(session)
  }

  /** Expire stale codes/sessions; called by the sweeper. Returns affected court ids. */
  async sweep(): Promise<number[]> {
    const now = Date.now()
    const affected = new Set<number>()

    // Expire sessions
    const activeSessions = await this.sessions.find({ where: { status: 'ACTIVE' } })
    for (const s of activeSessions) {
      if (s.expiresAt.getTime() < now) {
        s.status = 'EXPIRED'
        await this.sessions.save(s)
        affected.add(s.courtId)
      }
    }

    // Regenerate expired codes — but NEVER while a court is LIVE (codes frozen).
    const activeCodes = await this.codes.find({ where: { isActive: true } })
    for (const c of activeCodes) {
      if (c.expiresAt.getTime() >= now) continue
      const court = await this.courts.findOne({ where: { id: c.courtId } })
      if (!court || court.status === 'LIVE') continue
      if (court.status === 'PAIRED') {
        await this.revokeSessionsForCourt(court.id)
        court.status = 'IDLE'
        await this.courts.save(court)
      }
      await this.generateCode(c.courtId, 'idle_ttl')
      affected.add(c.courtId)
    }
    return [...affected]
  }
}
