import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Match } from './match.entity'
import { ScoreEvent } from './score-event.entity'
import { Court } from '../courts/court.entity'
import { MatchesService } from './matches.service'
import { PairingModule } from '../pairing/pairing.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, ScoreEvent, Court]),
    forwardRef(() => PairingModule),
  ],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
