import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import type { DeviceClass } from '../../common/types'

export class EnrollDto {
  @IsIn(['MOBILE', 'TABLET', 'TV', 'DESKTOP'])
  deviceClass: DeviceClass

  @IsString()
  @MaxLength(128)
  fingerprint: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  label?: string

  // TVs may present the provisioning key to be auto-approved.
  @IsOptional()
  @IsString()
  provisioningKey?: string
}
