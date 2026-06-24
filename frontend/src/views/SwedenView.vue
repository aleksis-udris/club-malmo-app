<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { OverallStatRow, Player, StandingRow } from '@/types'

const iconMan = '<span class="icon" aria-hidden="true">man</span>'
const iconWoman = '<span class="icon" aria-hidden="true">woman</span>'
const iconGroup = '<span class="icon" aria-hidden="true">group</span>'

interface SwedenData {
  groupStandings: StandingRow[]
  overallStats: OverallStatRow[]
  men: Player[]
  women: Player[]
  sweden: Player[]
  counts: { men: number; women: number }
}

const { withSeason, season } = useSeason()
const { data, loading, error, retry } = useApi<SwedenData>(() => withSeason('/content/sweden'))

const seasonLabel = computed(() => (season.value ? season.value.name : 'the current selection'))
const swedes = computed<Player[]>(() => data.value?.sweden ?? [])

const cat = (g?: string | null) => (g ? (g.toLowerCase() === 'female' ? 'W' : 'M') : '—')
const pct = (p?: number) => (typeof p === 'number' ? `${Math.round(p)}%` : '—')
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">Club Sweden (SWE)</h1>
      <p class="text-sm text-outline">Squad overview, group standings and overall statistics</p>
    </div>

    <StateBlock v-if="loading" type="loading" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <template v-else-if="data">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Men in club" :value="data.counts.men" :icon="iconMan" />
        <StatCard label="Women in club" :value="data.counts.women" :icon="iconWoman" />
        <StatCard
          label="Total players"
          :value="data.counts.men + data.counts.women"
          :icon="iconGroup"
          class="col-span-2 sm:col-span-1"
        />
      </div>

      <!-- Swedish players in this season — explicit message when there are none -->
      <SectionCard title="🇸🇪 Sweden players" :subtitle="`${swedes.length} players`">
        <StateBlock
          v-if="!swedes.length"
          type="empty"
          :message="`No Swedish players are found in the current selection.`"
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-outline">
                <th class="px-2.5 py-3 font-semibold">#</th>
                <th class="px-2.5 py-3 font-semibold">Player</th>
                <th class="px-2.5 py-3 font-semibold">Country</th>
                <th class="px-2.5 py-3 text-center font-semibold">Cat.</th>
                <th class="px-2.5 py-3 text-center font-semibold">Played</th>
                <th class="px-2.5 py-3 text-center font-semibold">W</th>
                <th class="px-2.5 py-3 text-center font-semibold">L</th>
                <th class="px-2.5 py-3 text-center font-semibold">Games</th>
                <th class="px-2.5 py-3 text-center font-semibold">Win%</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, i) in swedes"
                :key="p.id"
                class="border-t border-primary-container transition hover:bg-primary-container/60"
              >
                <td class="px-2.5 py-3 font-bold text-outline">{{ i + 1 }}</td>
                <td class="px-2.5 py-3 font-medium text-on-surface">{{ p.name }}</td>
                <td class="px-2.5 py-3">
                  <CountryFlag v-if="p.country" :country="p.country" />
                  <span v-else class="text-outline">—</span>
                </td>
                <td class="px-2.5 py-3 text-center text-outline">{{ cat(p.gender) }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ p.played }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ p.won ?? '—' }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ p.lost ?? '—' }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ p.games ?? '—' }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ pct(p.winPct) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        v-if="data.groupStandings.length"
        title="Season standings for players"
        subtitle="Top 8 by results"
      >
        <StandingsTable :rows="data.groupStandings" />
      </SectionCard>
      <StateBlock
        v-else
        type="empty"
        message="No player standings available for the current season yet."
      />

      <!-- Only shown if the feed provides an aggregate stats breakdown -->
      <SectionCard v-if="data.overallStats.length" title="Overall statistics" subtitle="Aggregate">
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-outline">
                <th class="px-3 py-3 font-semibold">Type</th>
                <th class="px-3 py-3 text-center font-semibold">Played</th>
                <th class="px-3 py-3 text-center font-semibold">Rubbers</th>
                <th class="px-3 py-3 text-center font-semibold">Games</th>
                <th class="px-3 py-3 text-center font-semibold">Points</th>
                <th class="px-3 py-3 text-center font-semibold">Walkovers</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in data.overallStats"
                :key="row.type"
                class="border-t border-primary-container transition hover:bg-primary-container/60"
                :class="row.type === 'Total' ? 'bg-primary-container/60 font-bold' : ''"
              >
                <td class="px-3 py-3 font-semibold text-on-surface">{{ row.type }}</td>
                <td class="px-3 py-3 text-center text-on-surface-variant">{{ row.played }}</td>
                <td class="px-3 py-3 text-center tabular-nums text-on-surface-variant">
                  {{ row.rubbers }}
                </td>
                <td class="px-3 py-3 text-center tabular-nums text-on-surface-variant">
                  {{ row.games }}
                </td>
                <td class="px-3 py-3 text-center font-extrabold text-primary">{{ row.points }}</td>
                <td class="px-3 py-3 text-center text-on-surface-variant">{{ row.walkovers }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
