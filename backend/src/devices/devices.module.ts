import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { Device } from './device.entity'
import { DevicesService } from './devices.service'
import { AuthService } from './auth.service'
import { AuthController, DevicesController } from './devices.controller'
import { AuthGuard } from '../common/guards/auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { DeviceClassGuard } from '../common/guards/device-class.guard'

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Device]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get<string>('jwtSecret') }),
    }),
  ],
  controllers: [DevicesController, AuthController],
  providers: [DevicesService, AuthService, AuthGuard, RolesGuard, DeviceClassGuard],
  exports: [DevicesService, AuthService, AuthGuard, RolesGuard, DeviceClassGuard, JwtModule],
})
export class DevicesModule {}
