import { Injectable } from '@nestjs/common'
import { JwtService, JwtSignOptions } from '@nestjs/jwt'
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
    const expiresIn = this.config.get<string>('jwtExpires') ?? '15m'
    const options = {
      secret: this.config.get<string>('jwtSecret'),
      // jsonwebtoken accepts a string like "15m"; cast for its strict StringValue type.
      expiresIn,
    } as JwtSignOptions
    const token = await this.jwt.signAsync(
      { sub: device.id, role: device.role, cls: device.deviceClass },
      options,
    )
    return { token, expiresIn, role: device.role }
  }
}
