<script setup lang="ts">
import type { StandingRow } from '@/types'
import CountryFlag from './CountryFlag.vue'

withDefaults(
  defineProps<{
    rows: StandingRow[]
    /** Highlight a country code (e.g. the user's club) */
    highlight?: string
  }>(),
  { highlight: '' },
)
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wider text-slate-400">
          <th class="px-2.5 py-3 font-semibold">#</th>
          <th class="px-2.5 py-3 font-semibold">Country</th>
          <th class="px-2.5 py-3 text-center font-semibold">Pld</th>
          <th class="px-2.5 py-3 text-center font-semibold">W</th>
          <th class="px-2.5 py-3 text-center font-semibold">D</th>
          <th class="px-2.5 py-3 text-center font-semibold">L</th>
          <th class="px-2.5 py-3 text-center font-semibold">Rubbers</th>
          <th class="px-2.5 py-3 text-center font-semibold">Games</th>
          <th class="px-2.5 py-3 text-center font-semibold">Pts</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.country.code + row.position"
          class="border-t border-brand-50 transition hover:bg-brand-50/60"
          :class="row.country.code === highlight ? 'bg-accent/15' : ''"
        >
          <td class="px-2.5 py-3">
            <span
              class="grid h-6 w-6 place-items-center rounded-full text-xs font-bold"
              :class="
                row.position <= 3
                  ? 'bg-brand-600 text-white'
                  : 'bg-brand-50 text-brand-700'
              "
              >{{ row.position }}</span
            >
          </td>
          <td class="px-2.5 py-3"><CountryFlag :country="row.country" /></td>
          <td class="px-2.5 py-3 text-center text-slate-500">{{ row.played }}</td>
          <td class="px-2.5 py-3 text-center font-semibold text-emerald-600">{{ row.won }}</td>
          <td class="px-2.5 py-3 text-center text-slate-500">{{ row.draws }}</td>
          <td class="px-2.5 py-3 text-center text-rose-500">{{ row.lost }}</td>
          <td class="px-2.5 py-3 text-center tabular-nums text-slate-600">{{ row.rubbers }}</td>
          <td class="px-2.5 py-3 text-center tabular-nums text-slate-600">{{ row.games }}</td>
          <td class="px-2.5 py-3 text-center font-extrabold text-brand-700">{{ row.points }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
