import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Device } from './device.entity'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Issue a short-lived session JWT bound to the device + role + class. */
  async issueSession(device: Device): Promise<{ token: string; expiresIn: string; role: string }> {
    const token = await this.jwt.signAsync(
      { sub: device.id, role: device.role, cls: device.deviceClass },
      {
        secret: this.config.get<string>('jwtSecret'),
        expiresIn: this.config.get<string>('jwtExpires'),
      },
    )
    return { token, expiresIn: this.config.get<string>('jwtExpires')!, role: device.role }
  }
}
