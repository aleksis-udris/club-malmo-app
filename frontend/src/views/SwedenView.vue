<script setup lang="ts">
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { OverallStatRow, Player, StandingRow } from '@/types'

interface SwedenData {
  groupStandings: StandingRow[]
  overallStats: OverallStatRow[]
  men: Player[]
  women: Player[]
  counts: { men: number; women: number }
}

const { withSeason } = useSeason()
const { data, loading, error, retry } = useApi<SwedenData>(() => withSeason('/content/sweden'))
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800">Tournament</h1>
      <p class="text-sm text-slate-400">Season players and standings</p>
    </div>

    <StateBlock v-if="loading" type="loading" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <template v-else-if="data">
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Players" :value="data.counts.men + data.counts.women" icon="👥" />
        <StatCard label="In standings" :value="data.groupStandings.length" icon="🏆" />
        <StatCard
          label="Women's draw"
          :value="data.counts.women"
          icon="🎾"
          class="col-span-2 sm:col-span-1"
        />
      </div>

      <SectionCard
        v-if="data.groupStandings.length"
        title="Season standings"
        subtitle="Top 8 by results"
      >
        <StandingsTable :rows="data.groupStandings" />
      </SectionCard>
      <StateBlock
        v-else
        type="empty"
        message="No standings available for the current season yet."
      />

      <!-- Only shown if the feed provides an aggregate stats breakdown -->
      <SectionCard
        v-if="data.overallStats.length"
        title="Overall statistics"
        subtitle="Aggregate"
      >
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-slate-400">
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
                class="border-t border-brand-50 transition hover:bg-brand-50/60"
                :class="row.type === 'Total' ? 'bg-brand-50/60 font-bold' : ''"
              >
                <td class="px-3 py-3 font-semibold text-slate-700">{{ row.type }}</td>
                <td class="px-3 py-3 text-center text-slate-500">{{ row.played }}</td>
                <td class="px-3 py-3 text-center tabular-nums text-slate-600">{{ row.rubbers }}</td>
                <td class="px-3 py-3 text-center tabular-nums text-slate-600">{{ row.games }}</td>
                <td class="px-3 py-3 text-center font-extrabold text-brand-700">{{ row.points }}</td>
                <td class="px-3 py-3 text-center text-slate-500">{{ row.walkovers }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
