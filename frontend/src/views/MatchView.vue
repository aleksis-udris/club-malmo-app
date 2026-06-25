<script setup lang="ts">
import { computed, ref } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { Match, MatchDay } from '@/types'

const { withSeason } = useSeason()
const { data, loading, error, retry } = useApi<MatchDay[]>(() => withSeason('/content/match-days'))

// Optional filters; '' = show everything (default).
const filter = ref('')
const statusFilter = ref('')
const dates = computed(() => data.value?.map((d) => d.date) ?? [])

// Order days: today first, then past/played matches (newest first), then upcoming (soonest first).
const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD, local
// Oldest past date to keep (2 weeks ago); older matches are hidden.
const twoWeeksAgo = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 14)
  return d.toLocaleDateString('en-CA')
})()
// Are there any matches actually scheduled for today?
const hasToday = computed(() =>
  (data.value ?? []).some((d) => d.date === today && d.matches.length > 0),
)
type Row = Match & { date: string }
// Group order: today on top; then if today exists -> upcoming, past last;
// if no today -> past on top, upcoming last.
function groupRank(date: string): number {
  if (date === 'unknown') return 9
  if (date === today) return 0
  const future = date > today
  return hasToday.value ? (future ? 1 : 2) : future ? 1 : 0
}

const rows = computed<Row[]>(() => {
  if (!data.value) return []
  // Drop matches more than 2 weeks old (keep today, recent past, all upcoming).
  let days = data.value.filter((d) => d.date === 'unknown' || d.date >= twoWeeksAgo)
  if (filter.value) days = days.filter((d) => d.date === filter.value)
  let r: Row[] = days.flatMap((d) => d.matches.map((m) => ({ ...m, date: d.date })))
  if (statusFilter.value) r = r.filter((m) => m.status === statusFilter.value)

  return r.sort((a, b) => {
    const ga = groupRank(a.date)
    const gb = groupRank(b.date)
    if (ga !== gb) return ga - gb
    const past = a.date !== 'unknown' && a.date < today
    // Within past (no-today case): matches with a score come first.
    if (past && !hasToday.value) {
      const sa = a.score ? 0 : 1
      const sb = b.score ? 0 : 1
      if (sa !== sb) return sa - sb
    }
    const aFuture = a.date !== 'unknown' && a.date > today
    if (a.date !== b.date) {
      return aFuture ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
    }
    return (a.time || '').localeCompare(b.time || '')
  })
})

const fmtDate = (s: string) =>
  s && s !== 'unknown'
    ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—'
const fmtLong = (s: string) =>
  s && s !== 'unknown'
    ? new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' })
    : 'Date TBD'

const statusStyle: Record<Match['status'], string> = {
  live: 'bg-red-100 text-red-700',
  finished: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-slate-100 text-slate-500',
}
const statusLabel: Record<Match['status'], string> = {
  live: '● LIVE',
  finished: 'Final',
  upcoming: 'Upcoming',
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800">Match Overview</h1>
        <p class="text-sm text-slate-400">
          {{ rows.length }} matches · Sweden / Malmö surfaced first
        </p>
      </div>
      <div class="flex items-end gap-3">
        <label class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">Show</span>
          <select
            v-model="statusFilter"
            class="rounded-lg border border-brand-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All matches</option>
            <option value="finished">Finished (history)</option>
            <option value="live">Live</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </label>
        <label v-if="dates.length" class="text-sm">
          <span class="mb-1 block font-semibold text-slate-600">Date</span>
          <select
            v-model="filter"
            class="rounded-lg border border-brand-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All dates</option>
            <option v-for="d in dates" :key="d" :value="d">{{ fmtLong(d) }}</option>
          </select>
        </label>
      </div>
    </div>

    <StateBlock v-if="loading" type="loading" title="Loading matches…" />

    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <SectionCard v-else :subtitle="`${rows.length} matches`" title="Matches">
      <StateBlock v-if="!rows.length" type="empty" message="No matches available." />
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wider text-slate-400">
              <th class="px-2 py-3 font-semibold">Date</th>
              <th class="px-2 py-3 font-semibold">Time</th>
              <th class="px-2 py-3 font-semibold">Tournament</th>
              <th class="px-2 py-3 font-semibold">Team 1</th>
              <th class="px-2 py-3 text-center font-semibold">Score</th>
              <th class="px-2 py-3 font-semibold">Team 2</th>
              <th class="px-2 py-3 font-semibold">Court</th>
              <th class="px-2 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in rows"
              :key="m.id"
              class="border-t border-brand-50 transition hover:bg-brand-50/60"
            >
              <td class="whitespace-nowrap px-2 py-3 font-semibold text-slate-600">
                {{ fmtDate(m.date) }}
              </td>
              <td class="whitespace-nowrap px-2 py-3 tabular-nums text-slate-500">
                {{ m.time || '—' }}
              </td>
              <td class="px-2 py-3 text-slate-500">{{ m.draw || '—' }}</td>
              <td class="px-2 py-3"><CountryFlag :country="m.home" /></td>
              <td class="px-2 py-3 text-center">
                <span
                  v-if="m.score"
                  class="inline-block rounded-md bg-brand-50 px-2 py-1 font-extrabold tabular-nums text-brand-700"
                  >{{ m.score }}</span
                >
                <span v-else class="text-slate-300">vs</span>
              </td>
              <td class="px-2 py-3"><CountryFlag :country="m.away" /></td>
              <td class="px-2 py-3 text-slate-500">{{ m.court || '—' }}</td>
              <td class="px-2 py-3 text-right">
                <span
                  class="inline-block rounded-full px-2 py-1 text-xs font-bold"
                  :class="statusStyle[m.status]"
                  >{{ statusLabel[m.status] }}</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <AppFooter />
  </div>
</template>
