<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import MatchTable from '@/components/MatchTable.vue'
import StandingsTable from '@/components/StandingsTable.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { MatchDay, StandingRow } from '@/types'

interface Meta {
  championship: { title: string; year: number; host: string }
}
interface Sweden {
  counts: { men: number; women: number }
  men: { country?: { code: string; name: string } }[]
  women: { country?: { code: string; name: string } }[]
}

const { withSeason } = useSeason()
const meta = useApi<Meta>('/content/meta')
const days = useApi<MatchDay[]>(() => withSeason('/content/match-days'))
const standings = useApi<StandingRow[]>(() => withSeason('/content/standings?bracket=top'))
const sweden = useApi<Sweden>(() => withSeason('/content/sweden'))

const today = computed(() => days.data.value?.[0] ?? null)
const liveCount = computed(
  () => today.value?.matches.filter((m) => m.status === 'live').length ?? 0,
)
const squad = computed(() =>
  sweden.data.value ? sweden.data.value.counts.men + sweden.data.value.counts.women : 0,
)
const nationCount = computed(() => {
  const d = sweden.data.value
  if (!d) return 0
  const codes = new Set<string>()
  for (const p of [...(d.men ?? []), ...(d.women ?? [])]) {
    const c = p.country?.code || p.country?.name
    if (c) codes.add(c)
  }
  return codes.size
})

const iconLive = '<span class="icon" aria-hidden="true">radio_button_checked</span>'
const iconCalendar = '<span class="icon" aria-hidden="true">calendar_month</span>'
const iconGroup = '<span class="icon" aria-hidden="true">group</span>'
const iconFlag = '<span class="icon" aria-hidden="true">flag</span>'
const iconPublic = '<span class="icon" aria-hidden="true">public</span>'

const quickLinks = [
  {
    to: '/matches',
    icon: '<span class="icon" aria-hidden="true">calendar_month</span>',
    label: 'Match overview',
    desc: 'Browse matches by date',
  },
  {
    to: '/calendar',
    icon: '<span class="icon" aria-hidden="true">event</span>',
    label: 'Event Calendar',
    desc: 'Tournaments · pick one to filter',
  },
  {
    to: '/standings',
    icon: '<span class="icon" aria-hidden="true">emoji_events</span>',
    label: 'Standings 1–8',
    desc: 'ESF championship table',
  },
  {
    to: '/nations',
    icon: '<span class="icon" aria-hidden="true">public</span>',
    label: 'Nations',
    desc: 'Country medal table',
  },
  {
    to: '/players',
    icon: '<span class="icon" aria-hidden="true">group</span>',
    label: 'Players',
    desc: 'Men & women squads',
  },
]
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">
        {{ meta.data.value?.championship.title ?? 'ESF Championship' }}
        {{ meta.data.value?.championship.year ?? '' }}
      </h1>
      <p class="text-sm text-outline">
        {{ meta.data.value?.championship.host ?? 'Squash Club Malmö' }} · 18–24 June
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Live now" :value="liveCount" :icon="iconLive" hint="matches in play" />
      <StatCard label="Today's matches" :value="today?.matches.length ?? 0" :icon="iconCalendar" />
      <StatCard label="Players" :value="squad" :icon="iconGroup" hint="men & women" />
      <StatCard label="Nations" :value="nationCount" :icon="iconPublic" hint="participating countries" />
    </div>

    <section>
      <h2 class="mb-3 text-sm font-bold uppercase tracking-wider text-outline">Explore</h2>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="link in quickLinks"
          :key="link.to"
          :to="link.to"
          class="group flex items-center gap-4 rounded-2xl border border-primary-container bg-surface-container-lowest p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
        >
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-container text-2xl group-hover:bg-primary-container"
            v-html="link.icon"
          />
          <span>
            <span class="block font-bold text-on-surface">{{ link.label }}</span>
            <span class="block text-xs text-outline">{{ link.desc }}</span>
          </span>
        </RouterLink>
      </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <SectionCard title="Today's matches" :subtitle="today?.label ?? ''">
        <MatchTable v-if="today" :matches="today.matches.slice(0, 5)" />
        <div class="px-4 py-3 text-right">
          <RouterLink to="/matches" class="text-sm font-semibold text-primary hover:underline">
            View all →
          </RouterLink>
        </div>
      </SectionCard>

      <SectionCard title="Top of the table" subtitle="ESF championship · positions 1–8">
        <StandingsTable :rows="(standings.data.value ?? []).slice(0, 5)" highlight="SWE" />
        <div class="px-4 py-3 text-right">
          <RouterLink to="/standings" class="text-sm font-semibold text-primary hover:underline">
            Full standings →
          </RouterLink>
        </div>
      </SectionCard>
    </div>

    <AppFooter />
  </div>
</template>
