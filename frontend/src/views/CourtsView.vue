<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppFooter from '@/components/AppFooter.vue'
import { useCourtHub } from '@/pairing/useCourtHub'
import type { CourtStatus } from '@/pairing/types'

const { courts, resetCourt, rotateCode } = useCourtHub()

const nowTs = ref(Date.now())
const timer = window.setInterval(() => (nowTs.value = Date.now()), 1000)
onBeforeUnmount(() => window.clearInterval(timer))

const statusStyle: Record<CourtStatus, string> = {
  OFFLINE: 'bg-surface-container text-on-surface-variant',
  IDLE: 'bg-surface-container text-on-surface-variant',
  PAIRED: 'bg-primary-container text-primary',
  LIVE: 'bg-red-100 text-red-700',
  FINISHED: 'bg-amber-100 text-amber-700',
}

function countdown(expiresAt: number): string {
  const ms = expiresAt - nowTs.value
  if (ms <= 0) return '0:00'
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-extrabold text-on-surface">Courts</h1>
      <p class="text-sm text-outline">
        Live status of all 6 courts · open a TV display or pair a controller
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="court in courts"
        :key="court.id"
        class="flex flex-col rounded-2xl border border-primary-container bg-surface-container-lowest p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-extrabold text-on-surface">{{ court.name }}</h2>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            :class="statusStyle[court.status]"
          >
            {{ court.status }}
          </span>
        </div>

        <div v-if="court.status === 'LIVE'" class="mt-4 rounded-xl bg-success/5 p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-outline">Live score</p>
          <p class="mt-1 truncate text-sm font-semibold text-on-surface">
            {{ court.board.home.name }} vs {{ court.board.away.name }}
          </p>
          <p class="mt-1 text-3xl font-black tabular-nums text-primary">
            {{ court.board.homePoints }} – {{ court.board.awayPoints }}
          </p>
          <p class="text-xs text-outline">
            games {{ court.board.homeGames }}–{{ court.board.awayGames }} · code hidden during play
          </p>
        </div>

        <div v-else class="mt-4 rounded-xl bg-primary-container p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-outline">Pairing code</p>
          <p class="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-primary">
            {{ court.code }}
          </p>
          <p class="mt-1 text-xs text-outline">
            regenerates in {{ countdown(court.codeExpiresAt) }}
            <template v-if="court.controllerToken"> · controller connected</template>
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            :to="`/tv/${court.id}`"
            class="flex-1 rounded-lg bg-success px-3 py-2 text-center text-xs font-bold text-white"
          >
            <span class="icon" aria-hidden="true">tv</span> Open TV
          </RouterLink>
          <button
            class="rounded-lg border border-primary-container px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary-container"
            :disabled="court.status === 'LIVE'"
            :class="court.status === 'LIVE' ? 'cursor-not-allowed opacity-40' : ''"
            @click="rotateCode(court.id)"
          >
            <span class="icon" aria-hidden="true">refresh</span> New code
          </button>
          <button
            class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            @click="resetCourt(court.id)"
          >
            <span class="icon" aria-hidden="true">restart_alt</span> Reset
          </button>
        </div>
      </div>
    </div>

    <p class="rounded-xl bg-primary-container px-4 py-3 text-xs text-primary">
      Tip: open a court's TV on one screen and the
      <RouterLink to="/controller" class="font-bold underline">Controller</RouterLink>
      on a phone, then enter the code shown on the TV to pair.
    </p>

    <AppFooter />
  </div>
</template>
