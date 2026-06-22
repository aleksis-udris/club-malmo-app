<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import MatchTable from '@/components/MatchTable.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import type { Match, StandingRow } from '@/types'

const latest = useApi<Match[]>('/content/latest?bracket=bottom')
const standings = useApi<StandingRow[]>('/content/standings?bracket=bottom')

const loading = computed(() => latest.loading.value || standings.loading.value)
const error = computed(() => latest.error.value || standings.error.value)
function retry() {
  latest.retry()
  standings.retry()
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800">Latest Matches — Lower Bracket</h1>
      <p class="text-sm text-slate-400">ESF championship · positions 9–16</p>
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

    <template v-else>
      <SectionCard title="Latest matches" subtitle="Positions 9–16">
        <MatchTable
          v-if="latest.data.value && latest.data.value.length"
          :matches="latest.data.value"
          :show-draw="false"
        />
        <StateBlock v-else type="empty" message="No recent matches to show." />
      </SectionCard>

      <SectionCard title="Standings" subtitle="Positions 9–16">
        <StandingsTable :rows="standings.data.value ?? []" />
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
