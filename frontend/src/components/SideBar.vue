<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

interface NavItem {
  to: string
  label: string
  icon: string
}

const groups: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Championship',
    items: [
      { to: '/', label: 'Home', icon: '🏠' },
      { to: '/matches', label: 'Matches', icon: '🗓️' },
      { to: '/standings', label: 'Standings (1–8)', icon: '🏆' },
      { to: '/latest', label: 'Latest (9–16)', icon: '📋' },
    ],
  },
  {
    heading: 'Sweden',
    items: [
      { to: '/sweden', label: 'Tournament', icon: '🏆' },
      { to: '/players', label: 'Players', icon: '👥' },
    ],
  },
  {
    heading: 'Live',
    items: [
      { to: '/courts', label: 'Courts', icon: '🟩' },
      { to: '/controller', label: 'Controller', icon: '📱' },
    ],
  },
]

const open = ref(false)
</script>

<template>
  <!-- Invisible hover trigger at the left edge (desktop): opens the sidebar -->
  <div
    class="fixed left-0 top-0 z-30 hidden h-full w-2.5 lg:block"
    aria-hidden="true"
    @mouseenter="open = true"
  />

  <!-- Floating menu button — affordance + primary control on touch devices -->
  <button
    class="fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-700 shadow-md ring-1 ring-brand-100 transition hover:bg-brand-50"
    :class="open ? 'pointer-events-none opacity-0' : 'opacity-100'"
    aria-label="Open navigation"
    @click="open = true"
  >
    <span class="text-xl leading-none">☰</span>
  </button>

  <!-- Backdrop (mainly for touch / click-away) -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-slate-900/20 lg:bg-transparent"
      @click="open = false"
    />
  </Transition>

  <!-- Sliding sidebar: hidden by default, closes when the cursor leaves it -->
  <aside
    class="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-brand-100 bg-white shadow-xl transition-transform duration-300 ease-in-out"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    @mouseleave="open = false"
  >
    <div class="flex items-center justify-between gap-3 border-b border-brand-100 px-5 py-5">
      <RouterLink to="/" class="flex items-center gap-3" @click="open = false">
        <span
          class="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-xl text-white shadow-sm"
          >🟢</span
        >
        <span class="leading-tight">
          <span class="block text-sm font-extrabold text-brand-800">Squash Club</span>
          <span class="block text-xs font-semibold tracking-wide text-brand-500"
            >MALMÖ · ESF 2026</span
          >
        </span>
      </RouterLink>
      <button
        class="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
        aria-label="Close navigation"
        @click="open = false"
      >
        <span class="text-lg leading-none">✕</span>
      </button>
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      <div v-for="group in groups" :key="group.heading">
        <p class="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          {{ group.heading }}
        </p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
              active-class="bg-brand-600 text-white hover:bg-brand-600 hover:text-white shadow-sm"
              @click="open = false"
            >
              <span class="text-base">{{ item.icon }}</span>
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

    <div class="border-t border-brand-100 px-6 py-4 text-xs text-slate-400">
      Frontend demo · mock data
    </div>
  </aside>
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
