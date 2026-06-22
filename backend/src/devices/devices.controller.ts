import { Body, Controller, Param, Post } from '@nestjs/common'
import { DevicesService } from './devices.service'
import { AuthService } from './auth.service'
import { EnrollDto } from './dto/enroll.dto'
import { SessionDto } from './dto/session.dto'

@Controller('devices')
export class DevicesController {
  constructor(
    private readonly devices: DevicesService,
    private readonly auth: AuthService,
  ) {}

  // Entry point: a device announces itself (TV with provisioning key auto-approves).
  @Post('enroll')
  enroll(@Body() dto: EnrollDto) {
    return this.devices.enroll(dto)
  }

  // Admin approval for non-auto-approved devices.
  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.devices.approve(id)
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly devices: DevicesService,
    private readonly auth: AuthService,
  ) {}

  // Exchange a registration token (+fingerprint) for a short-lived session JWT.
  @Post('session')
  async session(@Body() dto: SessionDto) {
    const device = await this.devices.verifyRegistration(dto.registrationToken, dto.fingerprint)
    return this.auth.issueSession(device)
  }
}
