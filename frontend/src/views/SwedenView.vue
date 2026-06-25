<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StatCard from '@/components/StatCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import { useSeason } from '@/composables/useSeason'
import type { Country, Player } from '@/types'

interface NationsData {
  men: Player[]
  women: Player[]
}

const { withSeason } = useSeason()
const { data, loading, error, retry } = useApi<NationsData>(() => withSeason('/content/sweden'))

interface NationRow {
  country: Country
  players: number
  played: number
  won: number
  lost: number
}

// Aggregate every player by their country — data not surfaced in any other view.
const nations = computed<NationRow[]>(() => {
  if (!data.value) return []
  const all = [...(data.value.men ?? []), ...(data.value.women ?? [])]
  const map = new Map<string, NationRow>()
  for (const p of all) {
    if (!p.country) continue
    const key = p.country.code || p.country.name
    const row =
      map.get(key) ?? { country: p.country, players: 0, played: 0, won: 0, lost: 0 }
    row.players += 1
    row.played += p.played ?? 0
    row.won += p.won ?? 0
    row.lost += p.lost ?? 0
    map.set(key, row)
  }
  return [...map.values()].sort(
    (a, b) => b.won - a.won || b.players - a.players || a.country.name.localeCompare(b.country.name),
  )
})

const totalPlayers = computed(() => nations.value.reduce((n, r) => n + r.players, 0))
const totalMatches = computed(() => nations.value.reduce((n, r) => n + r.played, 0))

const winPct = (r: NationRow) => {
  const decided = r.won + r.lost
  return decided ? `${Math.round((r.won / decided) * 100)}%` : '—'
}

const iconPublic = '<span class="icon" aria-hidden="true">public</span>'
const iconGroup = '<span class="icon" aria-hidden="true">group</span>'
const iconMatch = '<span class="icon" aria-hidden="true">sports_tennis</span>'
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">Nations</h1>
      <p class="text-sm text-outline">
        Participating countries ranked by wins · aggregated across all players
      </p>
    </div>

    <StateBlock v-if="loading" type="loading" title="Loading nations…" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <template v-else>
      <div class="grid grid-cols-3 gap-4">
        <StatCard label="Nations" :value="nations.length" :icon="iconPublic" />
        <StatCard label="Players" :value="totalPlayers" :icon="iconGroup" />
        <StatCard label="Matches" :value="totalMatches" :icon="iconMatch" hint="across all draws" />
      </div>

      <SectionCard title="Medal table" :subtitle="`${nations.length} nations`">
        <StateBlock
          v-if="!nations.length"
          type="empty"
          message="No nations have been synced yet for the current season."
        />
        <div v-else class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-outline">
                <th class="px-2.5 py-3 font-semibold">#</th>
                <th class="px-2.5 py-3 font-semibold">Nation</th>
                <th class="px-2.5 py-3 text-center font-semibold">Players</th>
                <th class="px-2.5 py-3 text-center font-semibold">Played</th>
                <th class="px-2.5 py-3 text-center font-semibold">W</th>
                <th class="px-2.5 py-3 text-center font-semibold">L</th>
                <th class="px-2.5 py-3 text-center font-semibold">Win%</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(r, i) in nations"
                :key="r.country.code || r.country.name"
                class="border-t border-primary-container transition hover:bg-primary-container/60"
              >
                <td class="px-2.5 py-3 font-bold text-outline">{{ i + 1 }}</td>
                <td class="px-2.5 py-3"><CountryFlag :country="r.country" /></td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ r.players }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ r.played }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ r.won }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums">{{ r.lost }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums font-semibold">{{ winPct(r) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </template>

    <AppFooter />
  </div>
</template>
