import { ref } from 'vue'

export interface SelectedSeason {
  id: string
  name: string
}

// In-memory only (NOT persisted): the app always starts with NO tournament
// selected, so every fresh load shows data from all tournaments. A selection
// lasts only while navigating within the current session.
const season = ref<SelectedSeason | null>(null)

/**
 * Global "selected tournament/season". When set, views append `?season=<id>` to
 * their API calls so the whole app shows data scoped to that event.
 */
export function useSeason() {
  function select(s: SelectedSeason) {
    season.value = s
  }
  function clear() {
    season.value = null
  }
  /** Append the selected season to a content path (handles existing query string). */
  function withSeason(path: string): string {
    if (!season.value) return path
    const q = `season=${encodeURIComponent(season.value.id)}`
    return path + (path.includes('?') ? '&' : '?') + q
  }
  return { season, select, clear, withSeason }
}
