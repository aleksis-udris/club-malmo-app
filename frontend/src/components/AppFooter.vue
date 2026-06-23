<script setup lang="ts">
const year = new Date().getFullYear()
</script>

<template>
  <footer
    class="mt-8 grid gap-8 rounded-2xl border border-brand-100 bg-white px-6 py-8 sm:grid-cols-2"
  >
    <div>
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Contact</h3>
      <ul class="mt-3 space-y-1.5 text-sm text-slate-500">
        <li>Sweden Squash Federation</li>
        <li>The Squash Club of Malmö</li>
        <li><a class="hover:text-brand-700" href="#">info@swedensquash.se</a></li>
        <li><a class="hover:text-brand-700" href="#">+46 40 123 45</a></li>
      </ul>
    </div>
    <div>
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Social media</h3>
      <div class="mt-3 flex gap-3 text-xl">
        <a href="#" aria-label="X" class="transition hover:scale-110">✖️</a>
        <a href="#" aria-label="Facebook" class="transition hover:scale-110">📘</a>
        <a href="#" aria-label="Instagram" class="transition hover:scale-110">📸</a>
      </div>
      <p class="mt-4 text-xs text-slate-400">© {{ year }} Squash Club Malmö</p>
    </div>
  </footer>
</template>
