import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import configuration from './config/configuration'
import { envValidationSchema } from './config/env.validation'
import { CacheModule } from './cache/cache.module'
import { DatabaseModule } from './database/database.module'
import { DevicesModule } from './devices/devices.module'
import { RealtimeModule } from './realtime/realtime.module'
import { CourtsModule } from './courts/courts.module'
import { PairingModule } from './pairing/pairing.module'
import { MatchesModule } from './matches/matches.module'
import { SportradarModule } from './sportradar/sportradar.module'
import { ContentModule } from './content/content.module'
import { HealthController } from './health.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    ScheduleModule.forRoot(),
    CacheModule,
    DatabaseModule,
    DevicesModule,
    RealtimeModule,
    CourtsModule,
    PairingModule,
    MatchesModule,
    SportradarModule,
    ContentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
