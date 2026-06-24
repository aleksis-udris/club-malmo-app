<script setup lang="ts">
import { useRouter } from 'vue-router'
import SectionCard from '@/components/SectionCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { Country } from '@/types'

const router = useRouter()
const { select, clear, season } = useSeason()

// Selecting a tournament scopes the whole app (Matches, Players, Standings…) to it.
function choose(ev: { id: string; name: string }) {
  select({ id: ev.id, name: ev.name })
  router.push('/matches')
}

function showAll() {
  clear()
}

interface CalendarEvent {
  id: string
  name: string
  gender: string | null
  dateFrom: string | null
  dateTo: string | null
  country: Country
  venue: string | null
  isSweden: boolean
  swedenPlaying: boolean
  nearby: boolean
  priority: number
}

const { data, loading, error, retry } = useApi<CalendarEvent[]>('/content/calendar')

const fmt = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
const range = (a: string | null, b: string | null) => {
  const f = fmt(a)
  const t = fmt(b)
  return f && t ? `${f} – ${t}` : f || t || '—'
}
const cat = (g: string | null) =>
  g ? g.charAt(0).toUpperCase() + g.slice(1).toLowerCase() : '—'
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800">Event Calendar</h1>
        <p class="text-sm text-slate-400">
          Click an event to view only its data · Sweden / Malmö highlighted first
        </p>
      </div>
      <div v-if="season" class="flex items-center gap-2 text-sm">
        <span class="text-slate-500">
          Viewing: <span class="font-bold text-brand-700">{{ season.name }}</span>
        </span>
        <button
          class="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-100"
          @click="showAll"
        >
          ✕ Show all tournaments
        </button>
      </div>
    </div>

    <StateBlock v-if="loading" type="loading" title="Loading calendar…" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <SectionCard v-else :subtitle="`${data?.length ?? 0} events`" title="Events">
      <StateBlock
        v-if="!data || !data.length"
        type="empty"
        message="No events have been synced yet for this season."
      />
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wider text-slate-400">
              <th class="px-2.5 py-3 font-semibold">Event</th>
              <th class="px-2.5 py-3 font-semibold">Dates</th>
              <th class="px-2.5 py-3 text-center font-semibold">Category</th>
              <th class="px-2.5 py-3 font-semibold">Court / Venue</th>
              <th class="px-2.5 py-3 font-semibold">Country</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ev in data"
              :key="ev.id"
              class="border-t border-brand-50 transition hover:bg-brand-50/60"
              :class="[
                ev.isSweden ? 'bg-accent/15' : ev.nearby ? 'bg-brand-50/60' : '',
                season && season.id === ev.id ? 'outline outline-2 outline-brand-400' : '',
              ]"
            >
              <td class="px-2.5 py-3 font-medium text-slate-700">
                <button
                  class="text-left font-semibold text-brand-700 hover:underline"
                  @click="choose(ev)"
                >
                  {{ ev.name }}
                </button>
                <span
                  v-if="season && season.id === ev.id"
                  class="ml-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white"
                  >● selected</span
                >
                <span
                  v-if="ev.swedenPlaying"
                  class="ml-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-brand-950"
                  >🇸🇪 SWE plays</span
                >
                <span
                  v-else-if="ev.isSweden"
                  class="ml-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-brand-950"
                  >🇸🇪 SWE</span
                >
                <span
                  v-else-if="ev.nearby"
                  class="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700"
                  >Nordic</span
                >
              </td>
              <td class="whitespace-nowrap px-2.5 py-3 text-slate-500">
                {{ range(ev.dateFrom, ev.dateTo) }}
              </td>
              <td class="px-2.5 py-3 text-center text-slate-500">{{ cat(ev.gender) }}</td>
              <td class="px-2.5 py-3 text-slate-500">{{ ev.venue || '—' }}</td>
              <td class="px-2.5 py-3">
                <CountryFlag v-if="ev.country && ev.country.name" :country="ev.country" />
                <span v-else class="text-slate-300">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <AppFooter />
  </div>
</template>
