import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { Role, VerifiedSession } from '../types'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required?.length) return true
    const session = ctx.switchToHttp().getRequest().session as VerifiedSession | undefined
    if (!session) throw new ForbiddenException('NO_SESSION')
    if (!required.includes(session.role)) throw new ForbiddenException('WRONG_ROLE')
    return true
  }
}
