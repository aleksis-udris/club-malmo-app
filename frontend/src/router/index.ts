import { createRouter, createWebHistory } from 'vue-router'
import {
  detectDeviceClass,
  getEffectiveDeviceClass,
  type DeviceClass,
} from '@/security/deviceDetect'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
  { path: '/matches', name: 'matches', component: () => import('@/views/MatchView.vue') },
  {
    path: '/standings',
    name: 'standings',
    component: () => import('@/views/StandingChampionshipView.vue'),
  },
  {
    path: '/calendar',
    name: 'calendar',
    component: () => import('@/views/CalendarView.vue'),
  },
  {
    path: '/event/:id',
    name: 'event',
    component: () => import('@/views/EventView.vue'),
  },
  { path: '/sweden', name: 'sweden', component: () => import('@/views/SwedenView.vue') },
  {
    path: '/players',
    name: 'players',
    component: () => import('@/views/SwedenPlayersView.vue'),
  },
  { path: '/courts', name: 'courts', component: () => import('@/views/CourtsView.vue') },
  {
    path: '/tv/:courtId',
    name: 'tv',
    component: () => import('@/views/TvScoreboardView.vue'),
    // Requirement 11/13: scoreboard is TV-only.
    meta: { fullscreen: true, requireDeviceClass: 'TV' as DeviceClass },
  },
  {
    path: '/controller',
    name: 'controller',
    component: () => import('@/views/ControllerView.vue'),
    // Requirement 10/14: controller is phone-only.
    meta: { requireDeviceClass: 'MOBILE' as DeviceClass },
  },
  {
    path: '/device-blocked',
    name: 'device-blocked',
    component: () => import('@/views/DeviceBlockedView.vue'),
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * Frontend device-class guard (UX only — real enforcement is server-side, see
 * docs/SPORTRADAR_AND_DEVICE_ACCESS_SPEC.md §B6). Routes a wrong-class device to a
 * friendly block screen instead of the restricted page.
 */
router.beforeEach((to) => {
  const need = to.meta.requireDeviceClass as DeviceClass | DeviceClass[] | undefined
  if (!need) return true
  const allowed = Array.isArray(need) ? need : [need]
  // The TV scoreboard must be reachable ONLY from a real TV: ignore the dev/query
  // override and use raw detection. Other restricted routes still allow the override.
  const cls = allowed.includes('TV') ? detectDeviceClass() : getEffectiveDeviceClass()
  if (allowed.includes(cls)) return true
  return {
    name: 'device-blocked',
    query: { need: allowed.join(','), got: cls, to: to.fullPath },
  }
})

export default router
