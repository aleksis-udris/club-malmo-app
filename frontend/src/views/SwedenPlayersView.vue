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

const sexLabel = (g?: string | null) => (g ? (g.toLowerCase() === 'female' ? 'Women' : 'Men') : '')
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">Sweden Club Players</h1>
      <p class="text-sm text-outline">Men's and women's squads · matches played</p>
    </div>

    <StateBlock v-if="loading" type="loading" />
    <StateBlock v-else-if="error" type="error" :message="error">
      <button
        class="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary"
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
        v-for="squad in sections"
        :key="squad.key"
        :title="squad.label"
        :subtitle="`${squad.players.length} players`"
      >
        <ul v-if="squad.players.length" class="divide-y divide-primary-container">
          <li
            v-for="(player, i) in squad.players"
            :key="player.id"
            class="flex items-center gap-3 px-3 py-3 transition hover:bg-primary-container/60"
          >
            <span class="w-5 text-sm font-bold text-outline">{{ i + 1 }}</span>
            <span
              class="grid h-9 w-9 place-items-center rounded-full bg-primary-container text-xs font-bold text-primary"
              >{{ initials(player.name) }}</span
            >
            <span class="flex-1 font-medium text-on-surface">{{ player.name }}</span>
            <span
              class="rounded-full bg-primary-container px-3 py-1 text-xs font-bold text-primary"
            >
              {{ player.played }} played
            </span>
          </li>
        </ul>
        <StateBlock v-else type="empty" message="No players registered." />
      </SectionCard>
    </div>

    <AppFooter />
  </div>
</template>
