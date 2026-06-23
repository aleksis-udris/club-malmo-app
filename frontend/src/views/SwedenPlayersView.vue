<script setup lang="ts">
import { computed } from 'vue'
import SectionCard from '@/components/SectionCard.vue'
import StateBlock from '@/components/StateBlock.vue'
import AppFooter from '@/components/AppFooter.vue'
import CountryFlag from '@/components/CountryFlag.vue'
import { useApi } from '@/composables/useApi'
import type { Player } from '@/types'

interface SwedenData {
  men: Player[]
  women: Player[]
  sweden: Player[]
  countries?: Record<string, number>
}

const { data, loading, error, retry } = useApi<SwedenData>('/content/sweden')

// Sweden-only table (computed by the backend) goes first; then full lists.
const sections = computed(() => {
  if (!data.value) return []
  const base = [
    { key: 'men', label: 'Players', players: data.value.men },
    { key: 'women', label: "Women's draw", players: data.value.women },
  ].filter((s) => s.players.length)
  const swe = data.value.sweden?.length
    ? [{ key: 'sweden', label: '🇸🇪 Sweden players', players: data.value.sweden }]
    : []
  return [...swe, ...base]
})

const initials = (name: string) =>
  name
    .split(/[ ,]+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const sexLabel = (g?: string | null) =>
  g ? (g.toLowerCase() === 'female' ? 'Women' : 'Men') : ''
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-800">Players</h1>
      <p class="text-sm text-slate-400">
        Season competitors · country, category and match stats
      </p>
    </div>

    <StateBlock v-if="loading" type="loading" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        @click="retry"
      >
        Retry
      </button>
    </StateBlock>

    <StateBlock
      v-else-if="!sections.length"
      type="empty"
      message="No players have been synced yet for the current season."
    />

    <div v-else class="space-y-6">
      <SectionCard
        v-for="section in sections"
        :key="section.key"
        :title="section.label"
        :subtitle="`${section.players.length} players`"
      >
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="text-left text-xs uppercase tracking-wider text-slate-400">
                <th class="px-2.5 py-3 font-semibold">#</th>
                <th class="px-2.5 py-3 font-semibold">Player</th>
                <th class="px-2.5 py-3 font-semibold">Country</th>
                <th class="px-2.5 py-3 text-center font-semibold">Cat.</th>
                <th class="px-2.5 py-3 text-center font-semibold">Played</th>
                <th class="px-2.5 py-3 text-center font-semibold">W</th>
                <th class="px-2.5 py-3 text-center font-semibold">L</th>
                <th class="px-2.5 py-3 text-center font-semibold">Games</th>
                <th class="px-2.5 py-3 text-center font-semibold">Win %</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(player, i) in (section.players as Player[])"
                :key="player.id"
                class="border-t border-brand-50 transition hover:bg-brand-50/60"
              >
                <td class="px-2.5 py-3">
                  <span
                    class="grid h-6 w-6 place-items-center rounded-full text-xs font-bold"
                    :class="
                      (player.rank ?? i + 1) <= 3
                        ? 'bg-brand-600 text-white'
                        : 'bg-brand-50 text-brand-700'
                    "
                    >{{ player.rank ?? i + 1 }}</span
                  >
                </td>
                <td class="px-2.5 py-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700"
                      >{{ initials(player.name) }}</span
                    >
                    <span class="font-medium text-slate-700">{{ player.name }}</span>
                  </div>
                </td>
                <td class="px-2.5 py-3">
                  <CountryFlag v-if="player.country" :country="player.country" />
                  <span v-else class="text-slate-300">—</span>
                </td>
                <td class="px-2.5 py-3 text-center text-slate-500">
                  {{ sexLabel(player.gender) || '—' }}
                </td>
                <td class="px-2.5 py-3 text-center text-slate-500">{{ player.played ?? 0 }}</td>
                <td class="px-2.5 py-3 text-center font-semibold text-emerald-600">
                  {{ player.won ?? 0 }}
                </td>
                <td class="px-2.5 py-3 text-center text-rose-500">{{ player.lost ?? 0 }}</td>
                <td class="px-2.5 py-3 text-center tabular-nums text-slate-600">
                  {{ player.games || '—' }}
                </td>
                <td class="px-2.5 py-3 text-center font-extrabold text-brand-700">
                  {{ (player.played ?? 0) > 0 ? (player.winPct ?? 0) + '%' : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>

    <AppFooter />
  </div>
</template>
