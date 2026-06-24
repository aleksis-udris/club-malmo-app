<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { detectDeviceClass, setDeviceOverride, type DeviceClass } from '@/security/deviceDetect'

const route = useRoute()
const router = useRouter()

const need = computed(
  () =>
    String(route.query.need ?? '')
      .split(',')
      .filter(Boolean) as DeviceClass[],
)
const got = computed(() => String(route.query.got ?? detectDeviceClass()))
const target = computed(() => String(route.query.to ?? '/'))

const label: Record<string, string> = {
  MOBILE: 'a mobile phone',
  TABLET: 'a tablet',
  TV: 'a TV display',
  DESKTOP: 'a desktop browser',
}

const isDev = !import.meta.env.PROD

// Dev-only: continue by overriding the detected class to a permitted one.
function previewAs(cls: DeviceClass) {
  setDeviceOverride(cls)
  router.replace(target.value)
}
</script>

<template>
  <div class="mx-auto max-w-md space-y-5 py-8 text-center">
    <div class="text-5xl"><span class="icon" aria-hidden="true">lock</span></div>
    <h1 class="text-2xl font-extrabold text-on-surface">Wrong device for this screen</h1>
    <p class="text-sm text-on-surface-variant">
      This page is restricted to
      <span class="font-semibold text-on-surface">
        {{ need.map((n) => label[n] ?? n).join(' or ') }}</span
      >. You appear to be on
      <span class="font-semibold text-on-surface">{{ label[got] ?? got }}</span
      >.
    </p>

    <div
      class="rounded-2xl border border-primary-container bg-surface-container-lowest p-5 text-left text-sm text-on-surface-variant shadow-sm"
    >
      <p class="font-semibold text-on-surface">Why am I seeing this?</p>
      <p class="mt-1 text-xs text-on-surface-variant">
        The controller is phone-only and the scoreboard is TV-only. In production this is enforced
        on the server with device registration tokens and session authentication — the check below
        is only a client-side convenience.
      </p>
    </div>

    <div v-if="isDev" class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-wider text-outline">Developer preview</p>
      <div class="flex flex-wrap justify-center gap-2">
        <button
          v-for="n in need"
          :key="n"
          class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white active:scale-95"
          @click="previewAs(n)"
        >
          Continue as {{ label[n] ?? n }}
        </button>
      </div>
    </div>

    <RouterLink to="/" class="inline-block text-sm font-semibold text-primary hover:underline">
      ← Back to home
    </RouterLink>
  </div>
</template>
