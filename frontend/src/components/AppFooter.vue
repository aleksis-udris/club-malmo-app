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
        <li>The Club Malmoe</li>
        <li>
          <a class="hover:text-brand-700" href="http://www.theclubmalmoe.se"
            >http://www.theclubmalmoe.se/</a
          >
        </li>
        <li><a class="hover:text-brand-700" href="">info@malmosquash.se</a></li>
        <li><a class="hover:text-brand-700" href="">+46 0406210430</a></li>
      </ul>
    </div>
    <div>
      <h3 class="text-xs font-bold uppercase tracking-wider text-outline">Social media</h3>
      <div class="mt-3 flex items-center gap-3">
        <a
          href="https://www.facebook.com/theclubmalmoe/"
          target="_blank"
          rel="noopener"
          aria-label="Facebook"
          class="transition hover:scale-110"
        >
          <img src="/facebook.png" alt="Facebook" class="h-5 w-5 rounded object-contain" />
        </a>
        <a
          href="https://www.instagram.com/theclubmalmoe/?hl=en"
          target="_blank"
          rel="noopener"
          aria-label="Instagram"
          class="transition hover:scale-110"
        >
          <img src="/instagram.jpg" alt="Instagram" class="h-5 w-5 rounded object-contain" />
        </a>
      </div>
      <p class="mt-4 text-xs text-outline">© {{ year }} Squash Club Malmö</p>
    </div>
  </footer>
</template>
