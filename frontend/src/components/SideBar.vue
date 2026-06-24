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
      { to: '/', label: 'Home', icon: '<span class="icon" aria-hidden="true">home</span>' },
      { to: '/matches', label: 'Matches', icon: '<span class="icon" aria-hidden="true">calendar_month</span>' },
      { to: '/calendar', label: 'Event Calendar', icon: '<span class="icon" aria-hidden="true">event</span>' },
      { to: '/standings', label: 'Standings (1–8)', icon: '<span class="icon" aria-hidden="true">emoji_events</span>' },
      { to: '/players', label: 'Players', icon: '<span class="icon" aria-hidden="true">group</span>' },
      { to: '/sweden', label: 'Club Sweden', icon: '<span class="icon" aria-hidden="true">flag</span>' },
    ],
  },
  {
    heading: 'Live',
    items: [
      { to: '/controller', label: 'Controller', icon: '<span class="icon" aria-hidden="true">smartphone</span>' },
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
    class="fixed left-3 top-3 z-30 grid h-10 w-10 place-items-center rounded-xl bg-surface-container-lowest text-primary shadow-md ring-1 ring-primary-container transition hover:bg-primary-container"
    :class="open ? 'pointer-events-none opacity-0' : 'opacity-100'"
    aria-label="Open navigation"
    @click="open = true"
  >
    <span class="text-xl leading-none"><span class="icon" aria-hidden="true">menu</span></span>
  </button>

  <!-- Backdrop (mainly for touch / click-away) -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-30 bg-scrim/20 lg:bg-transparent"
      @click="open = false"
    />
  </Transition>

  <!-- Sliding sidebar: hidden by default, closes when the cursor leaves it -->
  <aside
    class="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-primary-container bg-surface-container-lowest shadow-xl transition-transform duration-300 ease-in-out rounded-r-xl"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    @mouseleave="open = false"
  >
    <div
      class="flex items-center justify-between gap-3 border-b border-primary-container px-5 py-5"
    >
      <RouterLink to="/" class="flex items-center gap-3" @click="open = false">
        <span class="grid h-10 w-10 place-items-center rounded-xl text-xl text-white"
          ><img src="../assets/logo.svg" class="h-8 w-8"
        /></span>
        <span class="leading-tight">
          <span class="block text-sm font-extrabold text-primary">The Club Malmoe</span>
          <span class="block text-xs font-semibold tracking-wide text-on-primary-container"
            >MALMÖ · ESF 2026</span
          >
        </span>
      </RouterLink>
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      <div v-for="group in groups" :key="group.heading">
        <p class="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-outline">
          {{ group.heading }}
        </p>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.to">
            <RouterLink
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant transition hover:bg-primary-container hover:text-primary"
              active-class="bg-primary text-white hover:bg-primary hover:text-white shadow-sm"
              @click="open = false"
            >
              <span class="text-base" v-html="item.icon" />
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>

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
