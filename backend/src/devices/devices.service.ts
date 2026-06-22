import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { createHash, randomBytes, randomInt } from 'crypto'
import { Device } from './device.entity'
import type { DeviceClass, Role } from '../common/types'

const ROLE_BY_CLASS: Record<DeviceClass, Role> = {
  TV: 'ROLE_TV',
  MOBILE: 'ROLE_CONTROLLER',
  TABLET: 'ROLE_CONTROLLER',
  DESKTOP: 'ROLE_ADMIN',
}

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex')
}

@Injectable()
export class DevicesService {
  private readonly log = new Logger('DevicesService')

  constructor(
    @InjectRepository(Device) private readonly repo: Repository<Device>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Enrol a device. TVs presenting the provisioning key (or any device in dev)
   * are auto-approved and receive a registration token immediately.
   */
  async enroll(input: {
    deviceClass: DeviceClass
    fingerprint: string
    label?: string
    provisioningKey?: string
  }): Promise<{ deviceId: string; status: string; registrationToken?: string; enrollmentCode?: string }> {
    const role = ROLE_BY_CLASS[input.deviceClass]
    const device = this.repo.create({
      deviceClass: input.deviceClass,
      role,
      status: 'PENDING',
      label: input.label ?? null,
      fingerprint: input.fingerprint,
      enrollmentCode: String(randomInt(0, 1_000_000)).padStart(6, '0'),
    })

    const provisioned = input.provisioningKey === this.config.get<string>('provisioningKey')
    const autoApprove = provisioned || this.config.get<string>('nodeEnv') !== 'production'

    if (autoApprove) {
      const token = this.issueRegistrationToken(device)
      device.status = 'APPROVED'
      device.enrollmentCode = null
      await this.repo.save(device)
      return { deviceId: device.id, status: device.status, registrationToken: token }
    }

    await this.repo.save(device)
    return { deviceId: device.id, status: device.status, enrollmentCode: device.enrollmentCode! }
  }

  /** Admin approval path for non-auto-approved devices. */
  async approve(deviceId: string): Promise<{ registrationToken: string }> {
    const device = await this.repo.findOne({ where: { id: deviceId } })
    if (!device) throw new NotFoundException('DEVICE_NOT_FOUND')
    const token = this.issueRegistrationToken(device)
    device.status = 'APPROVED'
    device.enrollmentCode = null
    await this.repo.save(device)
    return { registrationToken: token }
  }

  private issueRegistrationToken(device: Device): string {
    const token = randomBytes(32).toString('base64url')
    device.registrationTokenHash = sha256(token)
    return token
  }

  /** Validate a registration token + fingerprint for a session request. */
  async verifyRegistration(registrationToken: string, fingerprint: string): Promise<Device> {
    const hash = sha256(registrationToken)
    const device = await this.repo.findOne({ where: { registrationTokenHash: hash } })
    if (!device || device.status !== 'APPROVED') throw new BadRequestException('INVALID_REGISTRATION')
    if (device.fingerprint && device.fingerprint !== fingerprint) {
      await this.flagAnomaly(device.id, 'FP_MISMATCH_AT_SESSION')
      throw new BadRequestException('DEVICE_FINGERPRINT_MISMATCH')
    }
    return device
  }

  async findApproved(deviceId: string): Promise<Device | null> {
    const device = await this.repo.findOne({ where: { id: deviceId } })
    return device && device.status === 'APPROVED' ? device : null
  }

  fingerprintMatches(device: Device, fp?: string): boolean {
    if (!device.fingerprint) return true // not bound -> skip
    return !!fp && device.fingerprint === fp
  }

  async flagAnomaly(deviceId: string, reason: string): Promise<void> {
    this.log.warn(`Device anomaly ${deviceId}: ${reason}`)
    await this.repo.increment({ id: deviceId }, 'anomalyCount', 1)
  }

  async revoke(deviceId: string): Promise<void> {
    await this.repo.update({ id: deviceId }, { status: 'REVOKED', registrationTokenHash: null })
  }
}
