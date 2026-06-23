<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import MatchTable from '@/components/MatchTable.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useApi } from '@/composables/useApi'
import type { MatchDay } from '@/types'

const { data, loading, error, retry } = useApi<MatchDay[]>('/content/match-days')

// "Today" is anchored to the most recent match day returned by the API.
const refDate = computed(() => data.value?.[0]?.date ?? '')

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
const minDate = computed(() => (refDate.value ? shiftDate(refDate.value, -3) : ''))

const selected = ref('')
watch(refDate, (v) => {
  if (v && !selected.value) selected.value = v
})

const selectedMatches = computed(
  () => data.value?.find((day) => day.date === selected.value)?.matches ?? [],
)

const prettyDate = (s: string) =>
  s
    ? new Date(s).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-800">Match Overview</h1>
        <p class="text-sm text-slate-400">U15 &amp; U17 league · pick a date to view its matches</p>
      </div>
      <label v-if="refDate" class="text-sm">
        <span class="mb-1 block font-semibold text-slate-600">Date</span>
        <input
          v-model="selected"
          type="date"
          :min="minDate"
          :max="refDate"
          class="rounded-lg border border-brand-200 bg-white px-3 py-2 font-medium text-slate-700 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </label>
    </div>

    <StateBlock v-if="loading" type="loading" title="Loading matches…" />

    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <SectionCard
      v-else
      :title="prettyDate(selected)"
      :subtitle="`${selectedMatches.length} match${selectedMatches.length === 1 ? '' : 'es'}`"
    >
      <MatchTable v-if="selectedMatches.length" :matches="selectedMatches" />
      <StateBlock v-else type="empty" message="No matches were scheduled on this date." />
    </SectionCard>

    <AppFooter />
  </div>
</template>
