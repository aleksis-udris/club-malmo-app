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
  OFFLINE: 'bg-slate-100 text-slate-500',
  IDLE: 'bg-slate-100 text-slate-600',
  PAIRED: 'bg-brand-100 text-brand-700',
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
      <h1 class="text-2xl font-extrabold text-slate-800">Courts</h1>
      <p class="text-sm text-slate-400">
        Live status of all 6 courts · open a TV display or pair a controller
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="court in courts"
        :key="court.id"
        class="flex flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-extrabold text-slate-800">{{ court.name }}</h2>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-bold"
            :class="statusStyle[court.status]"
          >
            {{ court.status }}
          </span>
        </div>

        <div v-if="court.status === 'LIVE'" class="mt-4 rounded-xl bg-court/5 p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-slate-400">Live score</p>
          <p class="mt-1 truncate text-sm font-semibold text-slate-700">
            {{ court.board.home.name }} vs {{ court.board.away.name }}
          </p>
          <p class="mt-1 text-3xl font-black tabular-nums text-brand-700">
            {{ court.board.homePoints }} – {{ court.board.awayPoints }}
          </p>
          <p class="text-xs text-slate-400">
            games {{ court.board.homeGames }}–{{ court.board.awayGames }} · code hidden during play
          </p>
        </div>

        <div v-else class="mt-4 rounded-xl bg-brand-50 p-4 text-center">
          <p class="text-xs uppercase tracking-wider text-slate-400">Pairing code</p>
          <p class="mt-1 font-mono text-3xl font-black tracking-[0.3em] text-brand-700">
            {{ court.code }}
          </p>
          <p class="mt-1 text-xs text-slate-400">
            regenerates in {{ countdown(court.codeExpiresAt) }}
            <template v-if="court.controllerToken"> · controller connected</template>
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <RouterLink
            :to="`/tv/${court.id}`"
            class="flex-1 rounded-lg bg-court px-3 py-2 text-center text-xs font-bold text-white"
          >
            📺 Open TV
          </RouterLink>
          <button
            class="rounded-lg border border-brand-200 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-50"
            :disabled="court.status === 'LIVE'"
            :class="court.status === 'LIVE' ? 'cursor-not-allowed opacity-40' : ''"
            @click="rotateCode(court.id)"
          >
            🔄 New code
          </button>
          <button
            class="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
            @click="resetCourt(court.id)"
          >
            ♻️ Reset
          </button>
        </div>
      </div>
    </div>

    <p class="rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
      Tip: open a court's TV on one screen and the
      <RouterLink to="/controller" class="font-bold underline">Controller</RouterLink>
      on a phone, then enter the code shown on the TV to pair.
    </p>

    <AppFooter />
  </div>
</template>
