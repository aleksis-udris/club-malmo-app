import { IsString, MaxLength } from 'class-validator'

export class SessionDto {
  @IsString()
  @MaxLength(256)
  registrationToken: string

  @IsString()
  @MaxLength(128)
  fingerprint: string
}
