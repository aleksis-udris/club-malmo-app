import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HomeView.vue'
import ClubView from '@/components/ClubView.vue'
import MatchView from '@/components/MatchView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/club', component: ClubView },
  { path: '/match', component: MatchView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
