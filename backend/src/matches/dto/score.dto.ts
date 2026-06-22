import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class ScoreDto {
  @IsInt()
  @Min(1)
  seq: number

  @IsIn(['POINT', 'UNDO', 'FOUL', 'SERVE', 'NEXT_GAME'])
  type: 'POINT' | 'UNDO' | 'FOUL' | 'SERVE' | 'NEXT_GAME'

  @IsOptional()
  @IsIn(['home', 'away'])
  side?: 'home' | 'away'

  @IsString()
  token: string
}

export class SetMatchDto {
  @IsString()
  token: string

  @IsString()
  home: string

  @IsString()
  away: string

  @IsOptional()
  @IsString()
  draw?: string
}
