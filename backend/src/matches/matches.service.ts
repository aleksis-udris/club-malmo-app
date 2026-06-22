import { ForbiddenException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Match } from './match.entity'
import { ScoreEvent } from './score-event.entity'
import { Court } from '../courts/court.entity'
import { PairingService } from '../pairing/pairing.service'

export const POINTS_TO_WIN = 11
export const GAMES_TO_WIN = 3

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(ScoreEvent) private readonly events: Repository<ScoreEvent>,
    @InjectRepository(Court) private readonly courts: Repository<Court>,
    private readonly pairing: PairingService,
  ) {}

  private async authorize(courtId: number, token: string) {
    const session = await this.pairing.validate(courtId, token)
    if (!session) throw new ForbiddenException('INVALID_PAIRING_TOKEN')
    return session
  }

  board(m: Match) {
    return {
      matchId: m.id,
      status: m.status,
      home: m.homeName,
      away: m.awayName,
      draw: m.draw,
      homePoints: m.homePoints,
      awayPoints: m.awayPoints,
      homeGames: m.homeGames,
      awayGames: m.awayGames,
      homeFouls: m.homeFouls,
      awayFouls: m.awayFouls,
      serving: m.serving,
      rubber: m.rubber,
      winner: m.winner,
    }
  }

  async setMatch(courtId: number, token: string, home: string, away: string, draw = '') {
    await this.authorize(courtId, token)
    const match = await this.matches.save(
      this.matches.create({
        courtId,
        status: 'CONFIGURED',
        homeName: home.trim() || 'Home',
        awayName: away.trim() || 'Away',
        draw: draw.trim(),
      }),
    )
    await this.courts.update({ id: courtId }, { currentMatchId: match.id, status: 'PAIRED' })
    return this.board(match)
  }

  private current(courtId: number) {
    return this.courts.findOne({ where: { id: courtId } }).then((c) =>
      c?.currentMatchId ? this.matches.findOne({ where: { id: c.currentMatchId } }) : null,
    )
  }

  async applyScore(
    courtId: number,
    token: string,
    cmd: { seq: number; type: string; side?: 'home' | 'away' },
  ) {
    const session = await this.authorize(courtId, token)
    const match = await this.current(courtId)
    if (!match) throw new ForbiddenException('NO_MATCH')

    // Idempotency (req: replayed command) — duplicate seq is a no-op.
    const existing = await this.events.findOne({ where: { matchId: match.id, seq: cmd.seq } })
    if (existing) return { board: this.board(match), duplicate: true }

    if (match.status === 'CONFIGURED' && (cmd.type === 'POINT' || cmd.type === 'NEXT_GAME')) {
      match.status = 'LIVE'
      await this.courts.update({ id: courtId }, { status: 'LIVE' })
    }

    switch (cmd.type) {
      case 'POINT':
        this.point(match, cmd.side ?? 'home')
        break
      case 'UNDO':
        if (cmd.side === 'home') match.homePoints = Math.max(0, match.homePoints - 1)
        else match.awayPoints = Math.max(0, match.awayPoints - 1)
        break
      case 'FOUL':
        if (cmd.side === 'home') match.homeFouls++
        else match.awayFouls++
        break
      case 'SERVE':
        match.serving = match.serving === 'home' ? 'away' : 'home'
        break
      case 'NEXT_GAME':
        this.nextGame(match)
        break
    }

    await this.matches.save(match)
    await this.events.save(
      this.events.create({
        matchId: match.id,
        seq: cmd.seq,
        type: cmd.type,
        payload: { side: cmd.side ?? null },
        sessionId: session.id,
      }),
    )

    if (match.status === 'FINISHED') await this.finalize(courtId, match)
    return { board: this.board(match), duplicate: false }
  }

  private point(match: Match, side: 'home' | 'away') {
    if (side === 'home') match.homePoints++
    else match.awayPoints++
    match.serving = side
    const lead = Math.abs(match.homePoints - match.awayPoints)
    if ((match.homePoints >= POINTS_TO_WIN || match.awayPoints >= POINTS_TO_WIN) && lead >= 2) {
      const winner = match.homePoints > match.awayPoints ? 'home' : 'away'
      if (winner === 'home') match.homeGames++
      else match.awayGames++
      match.homePoints = 0
      match.awayPoints = 0
      match.homeFouls = 0
      match.awayFouls = 0
      if (match.homeGames >= GAMES_TO_WIN || match.awayGames >= GAMES_TO_WIN) {
        match.status = 'FINISHED'
        match.winner = match.homeGames > match.awayGames ? 'home' : 'away'
      } else {
        match.rubber = Math.min(5, match.rubber + 1)
      }
    }
  }

  private nextGame(match: Match) {
    match.homePoints = 0
    match.awayPoints = 0
    match.homeFouls = 0
    match.awayFouls = 0
    match.rubber = Math.min(5, match.rubber + 1)
  }

  // Requirement 5: on match end, regenerate the pairing code immediately + release session.
  private async finalize(courtId: number, _match: Match) {
    await this.pairing.revokeSessionsForCourt(courtId)
    await this.courts.update({ id: courtId }, { status: 'FINISHED' })
    await this.pairing.generateCode(courtId, 'post_match')
  }

  async getCurrentBoard(courtId: number) {
    const match = await this.current(courtId)
    return match ? this.board(match) : null
  }
}
