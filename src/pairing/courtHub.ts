import { reactive, readonly } from 'vue'
import type { ClaimResult, CourtState, MatchBoard, Team } from './types'

/**
 * courtHub — authoritative in-browser simulation of the court-pairing backend
 * (see docs/COURT_PAIRING_SPEC.md). Manages all 6 courts: collision-free pairing
 * codes, 10-minute idle regeneration, immediate post-match regeneration, frozen
 * codes while LIVE, controller session tokens, expiry, and per-court scoring.
 *
 * Cross-tab / cross-device sync uses BroadcastChannel + localStorage — the client
 * analogue of the spec's WebSocket room broadcast. Swap this module's internals for
 * REST + Socket.IO to use the real backend; the composable surface stays identical.
 */

export const COURT_COUNT = 6
export const CODE_TTL_MS = 10 * 60 * 1000 // requirement 4: regenerate every 10 minutes
export const SESSION_TTL_MS = 4 * 60 * 60 * 1000
export const POINTS_TO_WIN = 11
export const GAMES_TO_WIN = 3

const STORAGE_KEY = 'scm:courthub:v1'
const CHANNEL = 'scm:courthub:v1'

function now() {
  return Date.now()
}

function randomToken(): string {
  // 256-bit-ish opaque token (demo). The real backend stores only its SHA-256 hash.
  const a = new Uint8Array(24)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(a)
  else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

function randomDigits(): string {
  const n =
    typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000
      : Math.floor(Math.random() * 1_000_000)
  return String(n).padStart(6, '0')
}

function defaultTeam(name: string): Team {
  return { name, flag: '🎽' }
}

function emptyBoard(): MatchBoard {
  return {
    home: defaultTeam('Home'),
    away: defaultTeam('Away'),
    draw: '',
    rubber: 1,
    homePoints: 0,
    awayPoints: 0,
    homeGames: 0,
    awayGames: 0,
    homeFouls: 0,
    awayFouls: 0,
    serving: 'home',
    winner: null,
  }
}

interface HubState {
  courts: CourtState[]
}

const state = reactive<HubState>({ courts: [] })

let channel: BroadcastChannel | null = null
let applyingRemote = false

/** Requirement 6: pick a 6-digit code not currently active on any other court. */
function uniqueCode(excludeCourtId?: number): string {
  const taken = new Set(
    state.courts.filter((c) => c.id !== excludeCourtId).map((c) => c.code),
  )
  let code = randomDigits()
  let guard = 0
  while (taken.has(code) && guard < 50) {
    code = randomDigits()
    guard++
  }
  return code
}

function regenerateCode(court: CourtState) {
  court.code = uniqueCode(court.id)
  court.codeGeneratedAt = now()
  court.codeExpiresAt = now() + CODE_TTL_MS
  court.updatedAt = now()
}

function createCourt(id: number): CourtState {
  const court: CourtState = {
    id,
    name: `Court ${id}`,
    status: 'IDLE',
    code: '',
    codeGeneratedAt: 0,
    codeExpiresAt: 0,
    controllerToken: null,
    controllerLabel: null,
    controllerExpiresAt: null,
    board: emptyBoard(),
    updatedAt: now(),
  }
  regenerateCode(court)
  return court
}

function load() {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as HubState
        if (parsed?.courts?.length === COURT_COUNT) {
          state.courts = parsed.courts
          return
        }
      }
    } catch {
      /* fall through to fresh init */
    }
  }
  // Build incrementally so each new court's code is checked against the ones
  // already created (uniqueCode reads state.courts) — guarantees no init collision.
  state.courts = []
  for (let i = 1; i <= COURT_COUNT; i++) state.courts.push(createCourt(i))
  persist()
}

function ensureChannel(): BroadcastChannel | null {
  if (channel || typeof BroadcastChannel === 'undefined') return channel
  channel = new BroadcastChannel(CHANNEL)
  channel.onmessage = (e: MessageEvent<HubState>) => {
    applyingRemote = true
    state.courts = e.data.courts
    applyingRemote = false
  }
  return channel
}

function persist() {
  if (applyingRemote) return
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  ensureChannel()?.postMessage(JSON.parse(JSON.stringify(state)) as HubState)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      applyingRemote = true
      state.courts = (JSON.parse(e.newValue) as HubState).courts
      applyingRemote = false
    }
  })
}

function getCourt(id: number): CourtState | undefined {
  return state.courts.find((c) => c.id === id)
}

/** Validate that a token currently controls a given court. */
function authorize(courtId: number, token: string | null | undefined): CourtState | null {
  const court = getCourt(courtId)
  if (!court || !token) return null
  if (court.controllerToken !== token) return null
  if (court.controllerExpiresAt && court.controllerExpiresAt < now()) return null
  return court
}

/* ----------------------------------------------------------------------
   Lifecycle actions
---------------------------------------------------------------------- */

/** Requirement 3 & 7: claim a court by entering its code; returns a scoped token. */
function claim(rawCode: string, label = 'Controller'): ClaimResult {
  const code = rawCode.trim()
  if (!/^\d{6}$/.test(code)) return { ok: false, error: 'CODE_NOT_FOUND' }

  const court = state.courts.find((c) => c.code === code)
  if (!court) return { ok: false, error: 'CODE_NOT_FOUND' }
  if (court.codeExpiresAt < now()) return { ok: false, error: 'CODE_EXPIRED' }
  if (court.status === 'LIVE' && court.controllerToken)
    return { ok: false, error: 'COURT_LIVE_LOCKED' }
  if (court.controllerToken) return { ok: false, error: 'COURT_BUSY' }

  const token = randomToken()
  court.controllerToken = token
  court.controllerLabel = label
  court.controllerExpiresAt = now() + SESSION_TTL_MS
  court.status = 'PAIRED'
  court.updatedAt = now()
  persist()
  return { ok: true, token, courtId: court.id }
}

/** Controller voluntarily disconnects (unpair). */
function disconnect(courtId: number, token: string) {
  const court = authorize(courtId, token)
  if (!court) return
  court.controllerToken = null
  court.controllerLabel = null
  court.controllerExpiresAt = null
  if (court.status !== 'LIVE') court.status = 'IDLE'
  court.updatedAt = now()
  persist()
}

function setMatch(
  courtId: number,
  token: string,
  home: string,
  away: string,
  draw: string,
): boolean {
  const court = authorize(courtId, token)
  if (!court) return false
  court.board = emptyBoard()
  court.board.home = defaultTeam(home.trim() || 'Home')
  court.board.away = defaultTeam(away.trim() || 'Away')
  court.board.draw = draw.trim()
  court.status = 'PAIRED'
  court.updatedAt = now()
  persist()
  return true
}

function markLive(court: CourtState) {
  if (court.status === 'PAIRED' || court.status === 'IDLE' || court.status === 'FINISHED') {
    court.status = 'LIVE'
  }
}

function endMatch(court: CourtState, winner: 'home' | 'away') {
  court.board.winner = winner
  court.status = 'FINISHED'
  // Requirement 5: immediately generate a new pairing code after a match ends,
  // and release the controller session.
  court.controllerToken = null
  court.controllerLabel = null
  court.controllerExpiresAt = null
  regenerateCode(court)
}

function addPoint(courtId: number, token: string, side: 'home' | 'away') {
  const court = authorize(courtId, token)
  if (!court) return
  const b = court.board
  markLive(court)
  if (side === 'home') b.homePoints += 1
  else b.awayPoints += 1
  b.serving = side

  const lead = Math.abs(b.homePoints - b.awayPoints)
  if ((b.homePoints >= POINTS_TO_WIN || b.awayPoints >= POINTS_TO_WIN) && lead >= 2) {
    const gameWinner = b.homePoints > b.awayPoints ? 'home' : 'away'
    if (gameWinner === 'home') b.homeGames += 1
    else b.awayGames += 1
    b.homePoints = 0
    b.awayPoints = 0
    b.homeFouls = 0
    b.awayFouls = 0
    if (b.homeGames >= GAMES_TO_WIN || b.awayGames >= GAMES_TO_WIN) {
      endMatch(court, b.homeGames > b.awayGames ? 'home' : 'away')
    } else {
      b.rubber = Math.min(5, b.rubber + 1)
    }
  }
  court.updatedAt = now()
  persist()
}

function removePoint(courtId: number, token: string, side: 'home' | 'away') {
  const court = authorize(courtId, token)
  if (!court) return
  const b = court.board
  if (side === 'home') b.homePoints = Math.max(0, b.homePoints - 1)
  else b.awayPoints = Math.max(0, b.awayPoints - 1)
  court.updatedAt = now()
  persist()
}

function addFoul(courtId: number, token: string, side: 'home' | 'away') {
  const court = authorize(courtId, token)
  if (!court) return
  if (side === 'home') court.board.homeFouls += 1
  else court.board.awayFouls += 1
  court.updatedAt = now()
  persist()
}

function toggleServe(courtId: number, token: string) {
  const court = authorize(courtId, token)
  if (!court) return
  court.board.serving = court.board.serving === 'home' ? 'away' : 'home'
  court.updatedAt = now()
  persist()
}

function nextGame(courtId: number, token: string) {
  const court = authorize(courtId, token)
  if (!court) return
  const b = court.board
  b.homePoints = 0
  b.awayPoints = 0
  b.homeFouls = 0
  b.awayFouls = 0
  b.rubber = Math.min(5, b.rubber + 1)
  court.updatedAt = now()
  persist()
}

/** Admin/operator reset (requirement: court resets). Clears board + rotates code. */
function resetCourt(courtId: number) {
  const court = getCourt(courtId)
  if (!court) return
  court.board = emptyBoard()
  court.controllerToken = null
  court.controllerLabel = null
  court.controllerExpiresAt = null
  court.status = 'IDLE'
  regenerateCode(court)
  persist()
}

/** Force a code rotation (admin). */
function rotateCode(courtId: number) {
  const court = getCourt(courtId)
  if (!court || court.status === 'LIVE') return
  regenerateCode(court)
  persist()
}

/* ----------------------------------------------------------------------
   Background ticker — code TTL sweeper + session expiry (spec §6.2)
---------------------------------------------------------------------- */
let ticking = false
function tick() {
  let changed = false
  const t = now()
  for (const court of state.courts) {
    // Session expiry
    if (court.controllerToken && court.controllerExpiresAt && court.controllerExpiresAt < t) {
      court.controllerToken = null
      court.controllerLabel = null
      court.controllerExpiresAt = null
      if (court.status !== 'LIVE') court.status = 'IDLE'
      court.updatedAt = t
      changed = true
    }
    // Idle/paired code regeneration — never while LIVE (codes frozen during play).
    if (
      (court.status === 'IDLE' || court.status === 'PAIRED' || court.status === 'FINISHED') &&
      court.codeExpiresAt < t
    ) {
      // If a controller was paired but never started a match, release it on rotation.
      if (court.status === 'PAIRED') {
        court.controllerToken = null
        court.controllerLabel = null
        court.controllerExpiresAt = null
        court.status = 'IDLE'
      }
      regenerateCode(court)
      changed = true
    }
  }
  if (changed) persist()
}

function startTicker() {
  if (ticking || typeof window === 'undefined') return
  ticking = true
  window.setInterval(tick, 1000)
}

/* ----------------------------------------------------------------------
   Bootstrap
---------------------------------------------------------------------- */
let booted = false
function boot() {
  if (booted) return
  booted = true
  ensureChannel()
  load()
  startTicker()
}

export const courtHub = {
  boot,
  state: readonly(state),
  getCourt,
  authorize: (courtId: number, token: string | null | undefined) =>
    authorize(courtId, token) !== null,
  claim,
  disconnect,
  setMatch,
  addPoint,
  removePoint,
  addFoul,
  toggleServe,
  nextGame,
  resetCourt,
  rotateCode,
  POINTS_TO_WIN,
  GAMES_TO_WIN,
  CODE_TTL_MS,
}
