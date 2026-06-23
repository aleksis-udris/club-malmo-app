import { computed } from 'vue'
import { courtHub } from './courtHub'

/**
 * Reactive access to the court hub. Boots the hub (idempotent) on first use and
 * exposes the courts list plus all lifecycle/scoring actions.
 */
export function useCourtHub() {
  courtHub.boot()

  const courts = computed(() => courtHub.state.courts)

  return {
    courts,
    getCourt: (id: number) => computed(() => courtHub.getCourt(id)),
    isAuthorized: courtHub.authorize,
    claim: courtHub.claim,
    disconnect: courtHub.disconnect,
    setMatch: courtHub.setMatch,
    addPoint: courtHub.addPoint,
    removePoint: courtHub.removePoint,
    addFoul: courtHub.addFoul,
    toggleServe: courtHub.toggleServe,
    nextGame: courtHub.nextGame,
    resetCourt: courtHub.resetCourt,
    rotateCode: courtHub.rotateCode,
    POINTS_TO_WIN: courtHub.POINTS_TO_WIN,
    GAMES_TO_WIN: courtHub.GAMES_TO_WIN,
    CODE_TTL_MS: courtHub.CODE_TTL_MS,
  }
}
