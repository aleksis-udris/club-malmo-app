import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Court } from './court.entity'
import { Match } from '../matches/match.entity'
import { CourtsService } from './courts.service'
import { CourtsController } from './courts.controller'
import { PairingModule } from '../pairing/pairing.module'
import { MatchesModule } from '../matches/matches.module'
import { RealtimeModule } from '../realtime/realtime.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Court, Match]),
    forwardRef(() => PairingModule),
    forwardRef(() => MatchesModule),
    RealtimeModule,
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
