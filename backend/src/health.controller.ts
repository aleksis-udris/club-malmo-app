import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'club-malmo-backend', time: new Date().toISOString() }
  }
}
