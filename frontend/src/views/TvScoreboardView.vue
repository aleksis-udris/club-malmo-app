<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { courtHub } from '@/pairing/courtHub'

// TV display only listens to the shared state — it never mutates it.
courtHub.boot()
const route = useRoute()

const courtId = computed(() => Number(route.params.courtId))
const court = computed(() => courtHub.getCourt(courtId.value))

const nowTs = ref(Date.now())
const timer = window.setInterval(() => (nowTs.value = Date.now()), 1000)
onBeforeUnmount(() => window.clearInterval(timer))

const board = computed(() => court.value?.board ?? null)
const showCode = computed(() => court.value != null && court.value.status !== 'LIVE')

const codeCountdown = computed(() => {
  if (!court.value) return '0:00'
  const ms = court.value.codeExpiresAt - nowTs.value
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})

const winnerName = computed(() => {
  const b = board.value
  if (!b || !b.winner) return null
  return b.winner === 'home' ? b.home.name : b.away.name
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gradient-to-b from-court to-[#06251b] text-white">
    <!-- Court not found -->
    <div v-if="!court" class="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <p class="text-2xl font-bold">Court not found</p>
      <RouterLink to="/courts" class="rounded-xl bg-surface-container-lowest/15 px-4 py-2 text-sm font-bold">
        ← Back to courts
      </RouterLink>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 sm:px-10">
        <div class="flex items-center gap-3">
          <span class="text-2xl"><span class="icon" aria-hidden="true">circle</span></span>
          <div class="leading-tight">
            <p class="text-sm font-bold sm:text-base">
              {{ court.name }}<span v-if="board?.draw"> · {{ board.draw }}</span>
            </p>
            <p class="text-xs text-emerald-300/80">Squash Club Malmö</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span
            v-if="court.status === 'LIVE'"
            class="flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold"
          >
            <span class="h-2 w-2 animate-pulse rounded-full bg-surface-container-lowest" /> LIVE
          </span>
          <span v-else class="rounded-full bg-surface-container-lowest/10 px-3 py-1 text-xs font-bold">
            {{ court.status }}
          </span>
          <RouterLink to="/courts" class="text-xs text-emerald-300/70 hover:text-white">
            ← exit
          </RouterLink>
        </div>
      </div>

      <!-- Pairing screen (not live) -->
      <div
        v-if="showCode"
        class="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center"
      >
        <p v-if="winnerName" class="mb-6 text-2xl font-black text-accent sm:text-3xl">
          <span class="icon" aria-hidden="true">emoji_events</span> {{ winnerName }} wins the match!
        </p>

        <p class="text-sm uppercase tracking-[0.3em] text-emerald-300/70">Pair your device</p>
        <p class="mt-2 max-w-md text-emerald-200/70">
          Open the controller app and enter this code to score on {{ court.name }}.
        </p>

        <div
          class="mt-8 rounded-3xl border-2 border-white/15 bg-surface-container-lowest/5 px-10 py-8 sm:px-16 sm:py-10"
        >
          <p class="font-mono text-6xl font-black tracking-[0.35em] sm:text-8xl">
            {{ court.code }}
          </p>
        </div>

        <p class="mt-6 text-sm text-emerald-300/60">
          Code regenerates in <span class="font-bold tabular-nums">{{ codeCountdown }}</span>
        </p>
        <p v-if="court.controllerToken" class="mt-2 text-sm font-bold text-accent">
          ● Controller connected — waiting to start
        </p>
      </div>

      <!-- Live scoreboard -->
      <div v-else-if="board" class="flex flex-1 items-center justify-center px-4 py-6">
        <div class="grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <!-- Home -->
          <div
            class="rounded-3xl border-2 p-6 text-center transition sm:p-10"
            :class="board.serving === 'home' ? 'border-primary-400 bg-surface-container-lowest/5' : 'border-white/10'"
          >
            <div class="text-6xl sm:text-8xl" aria-hidden="true">{{ board.home.flag }}</div>
            <p class="mt-2 text-xl font-bold sm:text-3xl">{{ board.home.name }}</p>
            <p class="mt-1 text-xs uppercase tracking-widest text-emerald-300/70">
              {{ board.homeGames }} games
              <span v-if="board.serving === 'home'" class="ml-1 text-accent">● serving</span>
            </p>
            <div class="mt-4 text-7xl font-black tabular-nums sm:text-9xl">
              {{ board.homePoints }}
            </div>
            <p v-if="board.homeFouls" class="mt-2 text-sm text-red-300">
              {{ board.homeFouls }} stroke{{ board.homeFouls > 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Center -->
          <div class="text-center">
            <p class="text-xs uppercase tracking-widest text-emerald-300/60">Game</p>
            <p class="text-4xl font-black sm:text-6xl">{{ board.rubber }}</p>
            <p class="mt-2 text-2xl font-bold text-emerald-300/40">VS</p>
            <p class="mt-3 text-base font-bold tabular-nums sm:text-xl">
              {{ board.homeGames }} – {{ board.awayGames }}
            </p>
          </div>

          <!-- Away -->
          <div
            class="rounded-3xl border-2 p-6 text-center transition sm:p-10"
            :class="board.serving === 'away' ? 'border-primary-400 bg-surface-container-lowest/5' : 'border-white/10'"
          >
            <div class="text-6xl sm:text-8xl" aria-hidden="true">{{ board.away.flag }}</div>
            <p class="mt-2 text-xl font-bold sm:text-3xl">{{ board.away.name }}</p>
            <p class="mt-1 text-xs uppercase tracking-widest text-emerald-300/70">
              {{ board.awayGames }} games
              <span v-if="board.serving === 'away'" class="ml-1 text-accent">● serving</span>
            </p>
            <div class="mt-4 text-7xl font-black tabular-nums sm:text-9xl">
              {{ board.awayPoints }}
            </div>
            <p v-if="board.awayFouls" class="mt-2 text-sm text-red-300">
              {{ board.awayFouls }} stroke{{ board.awayFouls > 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer status -->
      <div class="px-6 py-3 text-center text-xs text-emerald-300/50">
        Controlled live from the paired phone controller · {{ court.name }}
      </div>
    </template>
  </div>
</template>
