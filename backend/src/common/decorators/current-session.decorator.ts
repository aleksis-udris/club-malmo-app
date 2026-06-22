import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { VerifiedSession } from '../types'

export const CurrentSession = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): VerifiedSession | undefined =>
    ctx.switchToHttp().getRequest().session,
)
