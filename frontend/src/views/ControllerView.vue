<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { courtHub } from '@/pairing/courtHub'
import { CLAIM_ERROR_MESSAGE } from '@/pairing/types'

courtHub.boot()

const SESSION_KEY = 'scm:ctrl:session'
interface Session {
  courtId: number
  token: string
}

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

const session = ref<Session | null>(loadSession())

function saveSession(s: Session | null) {
  session.value = s
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
  else localStorage.removeItem(SESSION_KEY)
}

const court = computed(() =>
  session.value ? courtHub.getCourt(session.value.courtId) : undefined,
)
const authorized = computed(
  () => !!session.value && court.value?.controllerToken === session.value.token,
)
// Session existed but is no longer valid (match ended / reset / expiry).
const revoked = computed(() => !!session.value && !authorized.value)
const board = computed(() => court.value?.board ?? null)

/* ---- Pairing ---- */
const codeInput = ref('')
const claimError = ref<string | null>(null)

function connect() {
  claimError.value = null
  const res = courtHub.claim(codeInput.value, 'Phone controller')
  if (res.ok && res.token && res.courtId != null) {
    saveSession({ courtId: res.courtId, token: res.token })
    codeInput.value = ''
  } else {
    claimError.value = res.error ? CLAIM_ERROR_MESSAGE[res.error] : 'Could not connect.'
  }
}

function disconnect() {
  if (session.value) courtHub.disconnect(session.value.courtId, session.value.token)
  saveSession(null)
  showSetup.value = false
}

function dismissRevoked() {
  saveSession(null)
}

/* ---- Scoring (token-scoped) ---- */
const sides = [
  { key: 'home', label: 'home' },
  { key: 'away', label: 'away' },
] as const

function addPoint(side: 'home' | 'away') {
  if (session.value) courtHub.addPoint(session.value.courtId, session.value.token, side)
}
function removePoint(side: 'home' | 'away') {
  if (session.value) courtHub.removePoint(session.value.courtId, session.value.token, side)
}
function addFoul(side: 'home' | 'away') {
  if (session.value) courtHub.addFoul(session.value.courtId, session.value.token, side)
}
function toggleServe() {
  if (session.value) courtHub.toggleServe(session.value.courtId, session.value.token)
}
function nextGame() {
  if (session.value) courtHub.nextGame(session.value.courtId, session.value.token)
}

/* ---- Match setup (manual team names) ---- */
const showSetup = ref(false)
const homeName = ref('')
const awayName = ref('')
const drawLabel = ref('')

const homeInvalid = computed(() => homeName.value.trim().length === 0)
const awayInvalid = computed(() => awayName.value.trim().length === 0)
const canStart = computed(() => !homeInvalid.value && !awayInvalid.value)

function openSetup() {
  showSetup.value = !showSetup.value
  if (showSetup.value && board.value) {
    homeName.value = board.value.home.name === 'Home' ? '' : board.value.home.name
    awayName.value = board.value.away.name === 'Away' ? '' : board.value.away.name
    drawLabel.value = board.value.draw
  }
}

function applySetup() {
  if (!canStart.value || !session.value) return
  courtHub.setMatch(
    session.value.courtId,
    session.value.token,
    homeName.value,
    awayName.value,
    drawLabel.value,
  )
  showSetup.value = false
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-5">
    <!-- ============ PAIRING SCREEN ============ -->
    <template v-if="!authorized">
      <div>
        <h1 class="text-xl font-extrabold text-slate-800">Connect to a court</h1>
        <p class="text-sm text-slate-400">Enter the 6-digit code shown on the court's TV.</p>
      </div>

      <div
        v-if="revoked"
        class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
      >
        <span class="text-lg">⚠️</span>
        <div class="flex-1">
          <p class="font-semibold">Session ended</p>
          <p class="text-xs">
            The match finished or the court was reset. Read the new code on the TV to reconnect.
          </p>
        </div>
        <button class="text-xs font-bold underline" @click="dismissRevoked">Dismiss</button>
      </div>

      <div class="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <label class="block text-sm">
          <span class="font-semibold text-slate-600">Pairing code</span>
          <input
            v-model="codeInput"
            inputmode="numeric"
            maxlength="6"
            placeholder="000000"
            class="mt-1 w-full rounded-xl border px-4 py-3 text-center font-mono text-3xl font-black tracking-[0.3em] focus:outline-none focus:ring-2"
            :class="
              claimError
                ? 'border-red-300 focus:ring-red-100'
                : 'border-brand-200 focus:ring-brand-100'
            "
            @input="claimError = null"
            @keyup.enter="connect"
          />
        </label>
        <p v-if="claimError" class="mt-2 text-xs text-red-500">{{ claimError }}</p>
        <button
          class="mt-4 w-full rounded-xl py-3 font-bold text-white transition active:scale-95"
          :class="codeInput.trim().length === 6 ? 'bg-brand-600' : 'cursor-not-allowed bg-slate-300'"
          :disabled="codeInput.trim().length !== 6"
          @click="connect"
        >
          Connect
        </button>
      </div>

      <p class="rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
        No code? Open a court's TV from the
        <RouterLink to="/courts" class="font-bold underline">Courts</RouterLink>
        page — each TV shows its own pairing code.
      </p>
    </template>

    <!-- ============ CONTROL SCREEN ============ -->
    <template v-else-if="court && board">
      <header class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold text-slate-800">
            {{ court.name }}
            <span class="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              {{ court.status }}
            </span>
          </h1>
          <p class="text-sm text-slate-400">{{ board.draw || 'No draw set' }}</p>
        </div>
        <RouterLink
          :to="`/tv/${court.id}`"
          target="_blank"
          class="rounded-xl bg-court px-3 py-2 text-xs font-bold text-white"
        >
          📺 Open TV ↗
        </RouterLink>
      </header>

      <!-- Score panels -->
      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="side in sides"
          :key="side.key"
          class="rounded-2xl border-2 bg-white p-4 text-center shadow-sm transition"
          :class="board.serving === side.key ? 'border-accent' : 'border-brand-100'"
        >
          <p class="truncate font-bold text-slate-800">{{ board[side.key].name }}</p>
          <p class="text-xs text-slate-400">{{ board[`${side.key}Games`] }} games won</p>

          <div class="my-3 text-6xl font-black tabular-nums text-brand-700">
            {{ board[`${side.key}Points`] }}
          </div>

          <button
            class="w-full rounded-xl bg-brand-600 py-3 text-lg font-extrabold text-white transition active:scale-95"
            @click="addPoint(side.key)"
          >
            + Point
          </button>
          <div class="mt-2 grid grid-cols-2 gap-2">
            <button
              class="rounded-lg bg-slate-100 py-2 text-sm font-bold text-slate-600 active:scale-95"
              @click="removePoint(side.key)"
            >
              − 1
            </button>
            <button
              class="rounded-lg bg-red-50 py-2 text-sm font-bold text-red-600 active:scale-95"
              @click="addFoul(side.key)"
            >
              Stroke
            </button>
          </div>
          <p v-if="board[`${side.key}Fouls`]" class="mt-1 text-xs text-red-500">
            {{ board[`${side.key}Fouls`] }} stroke(s)
          </p>
        </div>
      </div>

      <!-- Match controls -->
      <div class="grid grid-cols-2 gap-2">
        <button
          class="rounded-xl bg-white py-3 text-sm font-bold text-slate-700 shadow-sm active:scale-95"
          @click="toggleServe"
        >
          🔁 Serve
        </button>
        <button
          class="rounded-xl bg-white py-3 text-sm font-bold text-slate-700 shadow-sm active:scale-95"
          @click="nextGame"
        >
          ⏭️ Next game
        </button>
      </div>

      <button
        class="w-full rounded-xl border border-brand-200 bg-white py-3 text-sm font-bold text-brand-700 active:scale-95"
        @click="openSetup"
      >
        ⚙️ {{ showSetup ? 'Close setup' : 'Set up match' }}
      </button>

      <!-- Setup panel: manual team names -->
      <Transition name="fade">
        <div
          v-if="showSetup"
          class="space-y-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm"
        >
          <label class="block text-sm">
            <span class="font-semibold text-slate-600">Home team</span>
            <input
              v-model="homeName"
              type="text"
              placeholder="e.g. Sweden"
              maxlength="40"
              class="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
              :class="
                homeInvalid
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-brand-200 focus:ring-brand-100'
              "
            />
            <span v-if="homeInvalid" class="mt-1 block text-xs text-red-500">
              Home team name is required.
            </span>
          </label>

          <label class="block text-sm">
            <span class="font-semibold text-slate-600">Away team</span>
            <input
              v-model="awayName"
              type="text"
              placeholder="e.g. Germany"
              maxlength="40"
              class="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2"
              :class="
                awayInvalid
                  ? 'border-red-300 focus:ring-red-100'
                  : 'border-brand-200 focus:ring-brand-100'
              "
            />
            <span v-if="awayInvalid" class="mt-1 block text-xs text-red-500">
              Away team name is required.
            </span>
          </label>

          <label class="block text-sm">
            <span class="font-semibold text-slate-600">Draw / pool</span>
            <input
              v-model="drawLabel"
              type="text"
              placeholder="e.g. U17 Open A"
              class="mt-1 w-full rounded-lg border border-brand-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <button
            class="w-full rounded-xl py-3 font-bold text-white transition active:scale-95"
            :class="canStart ? 'bg-brand-600' : 'cursor-not-allowed bg-slate-300'"
            :disabled="!canStart"
            @click="applySetup"
          >
            Apply match
          </button>
        </div>
      </Transition>

      <button
        class="w-full rounded-xl border border-rose-200 bg-white py-3 text-sm font-bold text-rose-600 active:scale-95"
        @click="disconnect"
      >
        Disconnect from {{ court.name }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
