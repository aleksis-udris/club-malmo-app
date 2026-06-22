import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as data from './content.data'

@Injectable()
export class ContentService {
  constructor(private readonly config: ConfigService) {}

  meta() {
    const sportradarEnabled = !!this.config.get('sportradar.enabled')
    return {
      championship: data.championship,
      // Where the championship dataset currently comes from. Swap to 'sportradar'
      // once a sync job populates these tables from the live feed.
      source: sportradarEnabled ? 'sportradar' : 'seed',
      sportradarEnabled,
      servedAt: new Date().toISOString(),
    }
  }

  matchDays() {
    return data.matchDays
  }
  standings(bracket: 'top' | 'bottom') {
    return bracket === 'bottom' ? data.standingsBottom : data.standingsTop
  }
  latest(bracket: 'top' | 'bottom') {
    return bracket === 'bottom' ? data.latestBottom : data.latestTop
  }
  sweden() {
    return {
      groupStandings: data.swedenGroupStandings,
      overallStats: data.swedenOverallStats,
      men: data.swedenMen,
      women: data.swedenWomen,
      counts: { men: data.swedenMen.length, women: data.swedenWomen.length },
    }
  }
}
