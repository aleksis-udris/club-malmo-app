import { Controller, Get, Query } from '@nestjs/common'
import { SportradarService } from './sportradar.service'

// Public read models — served from the local DB/cache, never from origin.
@Controller('sportradar')
export class SportradarController {
  constructor(private readonly sr: SportradarService) {}

  @Get('status')
  status() {
    return this.sr.status()
  }

  @Get('live')
  live() {
    return this.sr.getLive()
  }

  @Get('schedule')
  schedule() {
    return this.sr.getSchedule()
  }

  @Get('rankings')
  rankings(@Query('type') type = 'men') {
    return this.sr.getRankings(type)
  }
}
