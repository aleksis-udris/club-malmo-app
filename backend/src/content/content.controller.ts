import { Controller, Get, Param, Query } from '@nestjs/common'
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
  matchDays(@Query('season') season?: string) {
    return this.content.matchDays(season)
  }

  @Get('standings')
  standings(
    @Query('bracket') bracket: 'top' | 'bottom' = 'top',
    @Query('season') season?: string,
  ) {
    return this.content.standings(bracket === 'bottom' ? 'bottom' : 'top', season)
  }

  @Get('latest')
  latest(
    @Query('bracket') bracket: 'top' | 'bottom' = 'top',
    @Query('season') season?: string,
  ) {
    return this.content.latest(bracket === 'bottom' ? 'bottom' : 'top', season)
  }

  @Get('sweden')
  sweden(@Query('season') season?: string) {
    return this.content.sweden(season)
  }

  @Get('calendar')
  calendar() {
    return this.content.calendar()
  }

  @Get('event/:id')
  event(@Param('id') id: string) {
    return this.content.event(id)
  }
}
