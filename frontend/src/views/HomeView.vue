<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import MatchTable from '@/components/MatchTable.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import type { MatchDay, StandingRow } from '@/types'

interface Meta {
  championship: { title: string; year: number; host: string }
}
interface Sweden {
  counts: { men: number; women: number }
}

const meta = useApi<Meta>('/content/meta')
const days = useApi<MatchDay[]>('/content/match-days')
const standings = useApi<StandingRow[]>('/content/standings?bracket=top')
const sweden = useApi<Sweden>('/content/sweden')

const today = computed(() => days.data.value?.[0] ?? null)
const liveCount = computed(
  () => today.value?.matches.filter((m) => m.status === 'live').length ?? 0,
)
const squad = computed(() =>
  sweden.data.value ? sweden.data.value.counts.men + sweden.data.value.counts.women : 0,
)

const quickLinks = [
  { to: '/matches', icon: '🗓️', label: 'Match overview', desc: 'Browse matches by date' },
  { to: '/standings', icon: '🏆', label: 'Standings 1–8', desc: 'ESF championship table' },
  { to: '/latest', icon: '📋', label: 'Latest 9–16', desc: 'Lower-bracket results' },
  { to: '/sweden', icon: '🏆', label: 'Tournament', desc: 'Players & standings' },
  { to: '/players', icon: '👥', label: 'Players', desc: 'Men & women squads' },
  { to: '/courts', icon: '🟩', label: 'Courts', desc: 'TV pairing & live status' },
  { to: '/controller', icon: '📱', label: 'Score controller', desc: 'Pair & score a court' },
]
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800">
        {{ meta.data.value?.championship.title ?? 'ESF Championship' }}
        {{ meta.data.value?.championship.year ?? '' }}
      </h1>
      <p class="text-sm text-slate-400">
        {{ meta.data.value?.championship.host ?? 'Squash Club Malmö' }} · 18–24 June
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Live now" :value="liveCount" icon="🔴" hint="matches in play" />
      <StatCard label="Today's matches" :value="today?.matches.length ?? 0" icon="🗓️" />
      <StatCard label="Sweden squad" :value="squad" icon="🇸🇪" hint="men & women" />
      <StatCard label="Nations" :value="16" icon="🌍" hint="U15 & U17 combined" />
    </div>

    <section>
      <h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-slate-400">Explore</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="group flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
        >
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-2xl group-hover:bg-brand-100"
            >{{ link.icon }}</span
          >
          <span>
            <span class="block font-bold text-slate-800">{{ link.label }}</span>
            <span class="block text-xs text-slate-400">{{ link.desc }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Today's matches" :subtitle="today?.label ?? ''">
        <MatchTable v-if="today" :matches="today.matches.slice(0, 5)" />
        <div class="px-4 py-3 text-right">
          <RouterLink to="/matches" class="text-sm font-semibold text-brand-600 hover:underline">
            View all →
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="Top of the table" subtitle="ESF championship · positions 1–8">
        <StandingsTable :rows="(standings.data.value ?? []).slice(0, 5)" highlight="SWE" />
        <div class="px-4 py-3 text-right">
          <RouterLink to="/standings" class="text-sm font-semibold text-brand-600 hover:underline">
            Full standings →
          </RouterLink>
        </div>
      </SectionCard>
    </div>

    <AppFooter />
  </div>
</template>
