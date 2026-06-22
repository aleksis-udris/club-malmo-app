<script setup lang="ts">
import type { Country } from '@/types'

withDefaults(
  defineProps<{
    country: Country
    /** Show the country name next to the flag */
    showName?: boolean
    /** Show the 3-letter code instead of the full name */
    code?: boolean
  }>(),
  { showName: true, code: false },
)
</script>

<template>
  <span class="inline-flex items-center gap-2 whitespace-nowrap">
    <span class="text-lg leading-none" aria-hidden="true">{{ country.flag }}</span>
    <span v-if="showName" class="font-medium">
      {{ code ? country.code : country.name }}
    </span>
  </span>
</template>
