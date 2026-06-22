import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common'
import { PairingService } from './pairing.service'
import { CourtsService } from '../courts/courts.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { ClaimDto, DisconnectDto } from './dto/claim.dto'
import { AuthGuard } from '../common/guards/auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { DeviceClassGuard } from '../common/guards/device-class.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { RequireDeviceClass } from '../common/decorators/device-class.decorator'
import { CurrentSession } from '../common/decorators/current-session.decorator'
import type { VerifiedSession } from '../common/types'

const CLAIM_HTTP: Record<string, number> = {
  CODE_NOT_FOUND: 404,
  CODE_EXPIRED: 410,
  COURT_BUSY: 409,
  COURT_LIVE_LOCKED: 423,
}

// Requirement 10/14: pairing (controller entry) is restricted to MOBILE devices.
@Controller('pairing')
@UseGuards(AuthGuard, RolesGuard, DeviceClassGuard)
@Roles('ROLE_CONTROLLER')
@RequireDeviceClass('MOBILE')
export class PairingController {
  constructor(
    private readonly pairing: PairingService,
    private readonly courts: CourtsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post('claim')
  @HttpCode(200)
  async claim(@Body() dto: ClaimDto, @CurrentSession() session: VerifiedSession) {
    const result = await this.pairing.claim(dto.code, dto.label, session.deviceId)
    if (!result.ok) {
      const status = CLAIM_HTTP[result.error!] ?? 400
      return { statusCode: status, error: result.error }
    }
    const state = await this.courts.getState(result.courtId!)
    this.realtime.emitCourtState(result.courtId!, state)
    return { token: result.token, courtId: result.courtId, role: session.role }
  }

  @Post(':courtId/disconnect')
  @HttpCode(204)
  async disconnect(@Param('courtId') courtId: string, @Body() dto: DisconnectDto) {
    await this.pairing.disconnect(Number(courtId), dto.token)
    const id = Number(courtId)
    await this.courts.setStatus(id, 'IDLE')
    this.realtime.emitCourtState(id, await this.courts.getState(id))
  }
}
