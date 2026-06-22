import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { DEVICE_CLASS_KEY } from '../decorators/device-class.decorator'
import { DevicesService } from '../../devices/devices.service'
import type { DeviceClass, VerifiedSession } from '../types'

/**
 * Hard server-side enforcement of device class (req 10/11/13/14). The session's
 * device is looked up and its REGISTERED class is checked — UA is never trusted.
 * A fingerprint header corroborates to detect token theft / cloning.
 */
@Injectable()
export class DeviceClassGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly devices: DevicesService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<DeviceClass[]>(DEVICE_CLASS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ])
    if (!required?.length) return true

    const req = ctx.switchToHttp().getRequest()
    const session = req.session as VerifiedSession | undefined
    if (!session) throw new ForbiddenException('NO_SESSION')

    const device = await this.devices.findApproved(session.deviceId)
    if (!device) throw new ForbiddenException('DEVICE_NOT_APPROVED')
    if (!required.includes(device.deviceClass as DeviceClass))
      throw new ForbiddenException('WRONG_DEVICE_CLASS')

    const fp = req.headers['x-device-fp'] as string | undefined
    if (!this.devices.fingerprintMatches(device, fp)) {
      await this.devices.flagAnomaly(device.id, 'FP_MISMATCH')
      throw new ForbiddenException('DEVICE_FINGERPRINT_MISMATCH')
    }
    return true
  }
}
