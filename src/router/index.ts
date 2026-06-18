import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/HomeView.vue'
import ClubView from '@/components/ClubView.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/club', component: ClubView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
