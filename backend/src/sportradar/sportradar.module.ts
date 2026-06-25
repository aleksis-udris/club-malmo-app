import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SrEvent } from './entities/sr-event.entity'
import { SyncState } from './entities/sync-state.entity'
import { SrStanding } from './entities/sr-standing.entity'
import { SrCompetitor } from './entities/sr-competitor.entity'
import { SrCalendarEvent } from './entities/sr-calendar.entity'
import { SportradarClient } from './sportradar.client'
import { SportradarService } from './sportradar.service'
import { SportradarController } from './sportradar.controller'
import { SyncScheduler } from './sync.scheduler'

@Module({
  imports: [TypeOrmModule.forFeature([SrEvent, SyncState, SrStanding, SrCompetitor, SrCalendarEvent])],
  controllers: [SportradarController],
  providers: [SportradarClient, SportradarService, SyncScheduler],
  exports: [SportradarService],
})
export class SportradarModule {}
