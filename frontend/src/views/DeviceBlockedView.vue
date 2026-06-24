<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { detectDeviceClass, type DeviceClass } from '@/security/deviceDetect'

const route = useRoute()

const need = computed(
  () =>
    String(route.query.need ?? '')
      .split(',')
      .filter(Boolean) as DeviceClass[],
)
const got = computed(() => String(route.query.got ?? detectDeviceClass()))

const label: Record<string, string> = {
  MOBILE: 'a mobile phone',
  TABLET: 'a tablet',
  TV: 'a TV display',
  DESKTOP: 'a desktop browser',
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
        The scoreboard is TV-only and the controller is phone-only. These screens open only on the
        right device — the TV scoreboard can be reached only from a television.
      </p>
    </div>

    <RouterLink to="/" class="inline-block text-sm font-semibold text-primary hover:underline">
      ← Back to home
    </RouterLink>
  </div>
</template>
