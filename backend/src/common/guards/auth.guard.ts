import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import type { VerifiedSession } from '../types'

/**
 * Verifies the session JWT issued at /auth/session and attaches the verified
 * session (deviceId, role, class) to the request. This is the authoritative
 * identity — never the User-Agent.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest()
    const header: string | undefined = req.headers['authorization']
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('NO_TOKEN')
    try {
      const payload = await this.jwt.verifyAsync(header.slice(7), {
        secret: this.config.get<string>('jwtSecret'),
      })
      const session: VerifiedSession = {
        deviceId: payload.sub,
        role: payload.role,
        deviceClass: payload.cls,
      }
      req.session = session
      return true
    } catch {
      throw new UnauthorizedException('INVALID_TOKEN')
    }
  }
}
