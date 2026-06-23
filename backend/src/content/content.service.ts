import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SportradarService } from '../sportradar/sportradar.service'

/**
 * Championship content endpoints. All data is sourced from the Sportradar v2
 * read-models in the DB (no bundled/seed data). When Sportradar is disabled or
 * nothing has been synced yet, these return empty — so the app shows only data
 * that came from the API.
 */
@Injectable()
export class ContentService {
  constructor(
    private readonly config: ConfigService,
    private readonly sr: SportradarService,
  ) {}

  meta() {
    const enabled = !!this.config.get('sportradar.enabled')
    return {
      // App identity (branding, not match data).
      championship: {
        title: 'ESF Squash Championship',
        year: new Date().getFullYear(),
        host: 'Squash Club Malmö',
      },
      source: enabled ? 'sportradar' : 'empty',
      sportradarEnabled: enabled,
      servedAt: new Date().toISOString(),
    }
  }

  matchDays() {
    return this.sr.getMatchDays()
  }
  standings(bracket: 'top' | 'bottom') {
    return this.sr.getStandings(bracket)
  }
  latest(bracket: 'top' | 'bottom') {
    return this.sr.getLatest(bracket)
  }
  sweden() {
    return this.sr.getSweden()
  }
}
