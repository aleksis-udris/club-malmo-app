import { Controller, Get, Query } from '@nestjs/common'
import { ContentService } from './content.service'

// Public read models for the championship content (matches, standings, players).
@Controller('content')
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get('meta')
  meta() {
    return this.content.meta()
  }

  @Get('match-days')
  matchDays() {
    return this.content.matchDays()
  }

  @Get('standings')
  standings(@Query('bracket') bracket: 'top' | 'bottom' = 'top') {
    return this.content.standings(bracket === 'bottom' ? 'bottom' : 'top')
  }

  @Get('latest')
  latest(@Query('bracket') bracket: 'top' | 'bottom' = 'top') {
    return this.content.latest(bracket === 'bottom' ? 'bottom' : 'top')
  }

  @Get('sweden')
  sweden() {
    return this.content.sweden()
  }

  @Get('calendar')
  calendar() {
    return this.content.calendar()
  }
}
