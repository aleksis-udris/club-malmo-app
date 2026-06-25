import { Controller, Get } from '@nestjs/common'
import { SportradarService } from './sportradar.service'

// Public read models — served from the local DB/cache, never from origin.
@Controller('sportradar')
export class SportradarController {
  constructor(private readonly sr: SportradarService) {}

  @Get('status')
  status() {
    return this.sr.status()
  }

  // Debug: force a full sync now and return per-endpoint counts/errors.
  @Get('sync')
  sync() {
    return this.sr.runAll()
  }

  @Get('live')
  live() {
    return this.sr.getLive()
  }

  @Get('schedule')
  schedule() {
    return this.sr.getMatchDays()
  }
}
