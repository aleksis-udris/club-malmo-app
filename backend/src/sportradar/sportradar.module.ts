import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SrEvent } from './entities/sr-event.entity'
import { SrRanking } from './entities/sr-ranking.entity'
import { SyncState } from './entities/sync-state.entity'
import { SportradarClient } from './sportradar.client'
import { SportradarService } from './sportradar.service'
import { SportradarController } from './sportradar.controller'
import { SyncScheduler } from './sync.scheduler'

@Module({
  imports: [TypeOrmModule.forFeature([SrEvent, SrRanking, SyncState])],
  controllers: [SportradarController],
  providers: [SportradarClient, SportradarService, SyncScheduler],
  exports: [SportradarService],
})
export class SportradarModule {}
