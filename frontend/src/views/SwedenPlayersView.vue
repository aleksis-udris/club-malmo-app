<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { Player } from '@/types'

interface SwedenData {
  men: Player[]
  women: Player[]
  sweden: Player[]
  countries?: Record<string, number>
}

const { withSeason } = useSeason()
const { data, loading, error, retry } = useApi<SwedenData>(() => withSeason('/content/sweden'))

// All players in scope, ranked by wins then matches played.
const players = computed<Player[]>(() => {
  if (!data.value) return []
  return [...(data.value.men ?? []), ...(data.value.women ?? [])].sort(
    (a, b) => (b.won ?? 0) - (a.won ?? 0) || (b.played ?? 0) - (a.played ?? 0),
  )
})

const cat = (g?: string | null) => (g ? (g.toLowerCase() === 'female' ? 'W' : 'M') : '—')
const pct = (p?: number) => (typeof p === 'number' ? `${Math.round(p)}%` : '—')
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">Players</h1>
      <p class="text-sm text-outline">Match, win and game statistics for every player</p>
    </div>

    <StateBlock v-if="loading" type="loading" title="Loading players…" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <SectionCard v-else title="All players" :subtitle="`${players.length} players`">
      <StateBlock
        v-if="!players.length"
        type="empty"
        message="No players have been synced yet for the current season."
      />
      <div v-else class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="text-left text-xs uppercase tracking-wider text-outline">
              <th class="px-2.5 py-3 font-semibold">#</th>
              <th class="px-2.5 py-3 font-semibold">Player</th>
              <th class="px-2.5 py-3 font-semibold">Country</th>
              <th class="px-2.5 py-3 text-center font-semibold">Cat.</th>
              <th class="px-2.5 py-3 text-center font-semibold">Played</th>
              <th class="px-2.5 py-3 text-center font-semibold">W</th>
              <th class="px-2.5 py-3 text-center font-semibold">L</th>
              <th class="px-2.5 py-3 text-center font-semibold">Games</th>
              <th class="px-2.5 py-3 text-center font-semibold">Win%</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, i) in players"
              :key="p.id"
              class="border-t border-primary-container transition hover:bg-primary-container/60"
            >
              <td class="px-2.5 py-3 font-bold text-outline">{{ i + 1 }}</td>
              <td class="px-2.5 py-3 font-medium text-on-surface">{{ p.name }}</td>
              <td class="px-2.5 py-3">
                <CountryFlag v-if="p.country" :country="p.country" />
                <span v-else class="text-outline">—</span>
              </td>
              <td class="px-2.5 py-3 text-center text-outline">{{ cat(p.gender) }}</td>
              <td class="px-2.5 py-3 text-center tabular-nums">{{ p.played }}</td>
              <td class="px-2.5 py-3 text-center tabular-nums">{{ p.won ?? '—' }}</td>
              <td class="px-2.5 py-3 text-center tabular-nums">{{ p.lost ?? '—' }}</td>
              <td class="px-2.5 py-3 text-center tabular-nums">{{ p.games ?? '—' }}</td>
              <td class="px-2.5 py-3 text-center tabular-nums">{{ pct(p.winPct) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </SectionCard>

    <AppFooter />
  </div>
</template>
