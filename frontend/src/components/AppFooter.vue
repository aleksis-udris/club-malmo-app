<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="mt-8 grid gap-8 rounded-2xl border border-primary-container bg-surface-container-lowest px-6 py-8 sm:grid-cols-2"
  >
    <div>
      <h3 class="text-xs font-bold uppercase tracking-wider text-outline">Contact</h3>
      <ul class="mt-3 space-y-1.5 text-sm text-on-surface-variant">
        <li>Sweden Squash Federation</li>
        <li>The Squash Club of Malmö</li>
        <li><a class="hover:text-primary" href="#">info@swedensquash.se</a></li>
        <li><a class="hover:text-primary" href="#">+46 40 123 45</a></li>
      </ul>
    </div>
    <div>
      <h3 class="text-xs font-bold uppercase tracking-wider text-outline">Social media</h3>
      <div class="mt-3 flex gap-3 text-xl">
        <a href="#" aria-label="X" class="transition hover:scale-110"><span class="icon" aria-hidden="true">close</span></a>
        <a href="#" aria-label="Facebook" class="transition hover:scale-110"><span class="icon" aria-hidden="true">thumb_up</span></a>
        <a href="#" aria-label="Instagram" class="transition hover:scale-110"><span class="icon" aria-hidden="true">photo_camera</span></a>
      </div>
      <p class="mt-4 text-xs text-outline">© {{ year }} Squash Club Malmö</p>
    </div>
  </footer>
</template>
