<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import SideBar from './components/SideBar.vue'

const route = useRoute()
// The TV scoreboard (reachable from the controller) is a fullscreen display.
const fullscreen = computed(() => route.meta.fullscreen === true)
</script>

<template>
  <RouterView v-if="fullscreen" />

  <div v-else class="min-h-screen md-sys-color-background">
    <SideBar />
    <main class="min-h-screen">
      <div class="mx-auto w-full max-w-[1600px] px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
