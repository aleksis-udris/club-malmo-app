import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PairingCode } from './pairing-code.entity'
import { PairingSession } from './pairing-session.entity'
import { Court } from '../courts/court.entity'
import { PairingService } from './pairing.service'
import { PairingController } from './pairing.controller'
import { CodeSweeperService } from './code-sweeper.service'
import { RealtimeModule } from '../realtime/realtime.module'
import { CourtsModule } from '../courts/courts.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([PairingCode, PairingSession, Court]),
    RealtimeModule,
    forwardRef(() => CourtsModule),
  ],
  controllers: [PairingController],
  providers: [PairingService, CodeSweeperService],
  exports: [PairingService],
})
export class PairingModule {}
