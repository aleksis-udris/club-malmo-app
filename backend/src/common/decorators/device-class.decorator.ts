import { SetMetadata } from '@nestjs/common'
import type { DeviceClass } from '../types'

export const DEVICE_CLASS_KEY = 'deviceClass'
export const RequireDeviceClass = (...classes: DeviceClass[]) =>
  SetMetadata(DEVICE_CLASS_KEY, classes)
