<script setup lang="ts">
import type { Match } from '@/types'
import CountryFlag from './CountryFlag.vue'

withDefaults(
  defineProps<{
    matches: Match[]
    /** Show the Draw column (hidden on the latest-matches views) */
    showDraw?: boolean
  }>(),
  { showDraw: true },
)

const statusStyle: Record<Match['status'], string> = {
  live: 'bg-red-100 text-red-700',
  finished: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-surface-container text-on-surface-variant',
}

const statusLabel: Record<Match['status'], string> = {
  live: '● LIVE',
  finished: 'Final',
  upcoming: 'Upcoming',
}
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wider text-outline">
          <th class="px-3 py-3 font-semibold">Time</th>
          <th v-if="showDraw" class="px-3 py-3 font-semibold">Draw</th>
          <th class="px-3 py-3 font-semibold">Home</th>
          <th class="px-3 py-3 text-center font-semibold">Score</th>
          <th class="px-3 py-3 font-semibold">Away</th>
          <th class="px-3 py-3 font-semibold">Court</th>
          <th class="px-3 py-3 text-right font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="match in matches"
          :key="match.id"
          class="border-t border-primary-container transition hover:bg-primary-container/60"
        >
          <td
            class="whitespace-nowrap px-3 py-3 font-semibold tabular-nums text-on-surface-variant"
          >
            {{ match.time }}
          </td>
          <td v-if="showDraw" class="px-3 py-3 text-on-surface-variant">{{ match.draw }}</td>
          <td class="px-3 py-3"><CountryFlag :country="match.home" /></td>
          <td class="px-3 py-3 text-center">
            <span
              v-if="match.score"
              class="inline-block rounded-md bg-primary-container px-2.5 py-1 font-extrabold tabular-nums text-primary"
              >{{ match.score }}</span
            >
            <span v-else class="text-outline">vs</span>
          </td>
          <td class="px-3 py-3"><CountryFlag :country="match.away" /></td>
          <td class="whitespace-nowrap px-3 py-3 text-on-surface-variant">{{ match.court }}</td>
          <td class="px-3 py-3 text-right">
            <span
              class="inline-block rounded-full px-2.5 py-1 text-xs font-bold"
              :class="statusStyle[match.status]"
              >{{ statusLabel[match.status] }}</span
            >
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
