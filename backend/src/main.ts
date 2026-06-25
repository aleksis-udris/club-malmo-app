import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false })
  const config = app.get(ConfigService)

  app.setGlobalPrefix('api/v1')
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalFilters(new AllExceptionsFilter())

  // When CORS_ORIGIN is '*' (default), reflect the request origin so the frontend
  // works whether it's opened on localhost or the LAN IP. credentials:true cannot
  // be combined with a literal '*', hence the reflect.
  const corsOrigin = config.get<string>('corsOrigin')
  app.enableCors({ origin: corsOrigin === '*' ? true : corsOrigin, credentials: true })

  const port = config.get<number>('port') ?? 3000
  // Bind to 0.0.0.0 so the API is reachable on the LAN IP AND localhost at once.
  // Override the interface with HOST if needed.
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen(port, host)

  const log = new Logger('Bootstrap')
  log.log(`Backend listening on http://192.168.1.5:${port}/api/v1 (LAN)`)
  log.log(`Backend listening on http://localhost:${port}/api/v1 (local)`)
}
bootstrap()
