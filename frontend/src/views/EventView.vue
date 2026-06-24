<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import SectionCard from '@/components/SectionCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import MatchTable from '@/components/MatchTable.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import type { Country, Match, StandingRow, Player } from '@/types'

interface EventDetail {
  info: {
    id: string
    name: string
    gender: string | null
    dateFrom: string | null
    dateTo: string | null
    country: Country
    venue: string | null
  }
  matches: Match[]
  players: Player[]
  standings: StandingRow[]
}

const route = useRoute()
const id = computed(() => String(route.params.id))
const { data, loading, error, retry } = useApi<EventDetail>(
  `/content/event/${encodeURIComponent(id.value)}`,
)

const fmt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const range = (a: string | null, b: string | null) => {
  const f = fmt(a)
  const t = fmt(b)
  return f && t ? `${f} – ${t}` : f || t || ''
}
const cat = (g: string | null) => (g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : '')
</script>

<template>
  <div class="space-y-5">
    <RouterLink to="/calendar" class="text-sm font-semibold text-brand-600 hover:underline">
      ← Back to calendar
    </RouterLink>

    <StateBlock v-if="loading" type="loading" title="Loading event…" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <template v-else-if="data">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800">{{ data.info.name }}</h1>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
          <span v-if="range(data.info.dateFrom, data.info.dateTo)">
            {{ range(data.info.dateFrom, data.info.dateTo) }}
          </span>
          <span v-if="cat(data.info.gender)">· {{ cat(data.info.gender) }}</span>
          <span v-if="data.info.venue">· {{ data.info.venue }}</span>
          <span v-if="data.info.country && data.info.country.name" class="inline-flex items-center gap-1">
            · <CountryFlag :country="data.info.country" />
          </span>
        </div>
      </div>

      <SectionCard title="Matches" :subtitle="`${data.matches.length}`">
        <MatchTable v-if="data.matches.length" :matches="data.matches" :show-draw="false" />
        <StateBlock v-else type="empty" message="No matches available for this event yet." />
      </SectionCard>

      <SectionCard title="Standings" subtitle="Players ranked by results in this event">
        <StandingsTable v-if="data.standings.length" :rows="data.standings" />
        <StateBlock v-else type="empty" message="No results to rank yet." />
      </SectionCard>

      <SectionCard title="Players" :subtitle="`${data.players.length}`">
        <ul v-if="data.players.length" class="divide-y divide-brand-50">
          <li
            v-for="(p, i) in data.players"
            :key="p.id"
            class="flex items-center gap-3 px-3 py-2.5 transition hover:bg-brand-50/60"
          >
            <span class="w-5 text-sm font-bold text-slate-300">{{ p.rank ?? i + 1 }}</span>
            <CountryFlag v-if="p.country" :country="p.country" :show-name="false" />
            <span class="flex-1 font-medium text-slate-700">{{ p.name }}</span>
            <span class="text-xs text-slate-400">{{ p.won ?? 0 }}-{{ p.lost ?? 0 }}</span>
          </li>
        </ul>
        <StateBlock v-else type="empty" message="No players found for this event." />
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
