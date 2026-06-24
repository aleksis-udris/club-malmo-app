<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import MatchTable from '@/components/MatchTable.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { Match, StandingRow } from '@/types'

const { withSeason } = useSeason()
const standings = useApi<StandingRow[]>(() => withSeason('/content/standings?bracket=top'))
const latest = useApi<Match[]>(() => withSeason('/content/latest?bracket=top'))

const loading = computed(() => standings.loading.value || latest.loading.value)
const error = computed(() => standings.error.value || latest.error.value)
function retry() {
  standings.retry()
  latest.retry()
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">ESF Championship — Standings</h1>
      <p class="text-sm text-outline">Positions 1–8 and the latest championship matches</p>
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

    <template v-else>
      <SectionCard title="Standing of ESF Championship" subtitle="Positions 1–8">
        <StandingsTable :rows="standings.data.value ?? []" highlight="SWE" />
      </SectionCard>

      <SectionCard title="Latest matches" subtitle="ESF championship · positions 1–8">
        <MatchTable
          v-if="latest.data.value && latest.data.value.length"
          :matches="latest.data.value"
          :show-draw="false"
        />
        <StateBlock v-else type="empty" message="No recent matches to show." />
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
