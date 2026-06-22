import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { CourtsService } from './courts.service'
import { MatchesService } from '../matches/matches.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { SetMatchDto, ScoreDto } from '../matches/dto/score.dto'
import { AuthGuard } from '../common/guards/auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { DeviceClassGuard } from '../common/guards/device-class.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { RequireDeviceClass } from '../common/decorators/device-class.decorator'

@Controller()
export class CourtsController {
  constructor(
    private readonly courts: CourtsService,
    private readonly matches: MatchesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // Public read models (served from DB; clients never call Sportradar/origin).
  @Get('courts')
  list() {
    return this.courts.findAll()
  }

  @Get('courts/:id/state')
  state(@Param('id') id: string) {
    return this.courts.getState(Number(id))
  }

  // Requirement 11/13: scoreboard read is restricted to TV devices.
  @Get('scoreboard/:id')
  @UseGuards(AuthGuard, RolesGuard, DeviceClassGuard)
  @Roles('ROLE_TV')
  @RequireDeviceClass('TV')
  scoreboard(@Param('id') id: string) {
    return this.courts.getState(Number(id))
  }

  // Match configuration + scoring: MOBILE controllers only (+ valid court token).
  @Post('courts/:id/match')
  @UseGuards(AuthGuard, RolesGuard, DeviceClassGuard)
  @Roles('ROLE_CONTROLLER')
  @RequireDeviceClass('MOBILE')
  async setMatch(@Param('id') id: string, @Body() dto: SetMatchDto) {
    const courtId = Number(id)
    const board = await this.matches.setMatch(courtId, dto.token, dto.home, dto.away, dto.draw)
    this.realtime.emitCourtState(courtId, await this.courts.getState(courtId))
    return board
  }

  @Post('courts/:id/score')
  @UseGuards(AuthGuard, RolesGuard, DeviceClassGuard)
  @Roles('ROLE_CONTROLLER')
  @RequireDeviceClass('MOBILE')
  async score(@Param('id') id: string, @Body() dto: ScoreDto) {
    const courtId = Number(id)
    const result = await this.matches.applyScore(courtId, dto.token, {
      seq: dto.seq,
      type: dto.type,
      side: dto.side,
    })
    const state = await this.courts.getState(courtId)
    this.realtime.emitCourtState(courtId, state)
    this.realtime.emitScore(courtId, result.board)
    return result
  }

  // Admin reset.
  @Post('courts/:id/reset')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ROLE_ADMIN')
  async reset(@Param('id') id: string) {
    const courtId = Number(id)
    await this.courts.reset(courtId)
    this.realtime.emitCourtState(courtId, await this.courts.getState(courtId))
    return { ok: true }
  }
}
