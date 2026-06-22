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
  app.enableCors({ origin: config.get('corsOrigin'), credentials: true })

  const port = config.get<number>('port') ?? 3000
  await app.listen(port)
  new Logger('Bootstrap').log(`Backend listening on http://localhost:${port}/api/v1`)
}
bootstrap()
