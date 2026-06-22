import { IsOptional, IsString, Length } from 'class-validator'

export class ClaimDto {
  @IsString()
  @Length(6, 6)
  code: string

  @IsOptional()
  @IsString()
  label?: string
}

export class DisconnectDto {
  @IsString()
  token: string
}
