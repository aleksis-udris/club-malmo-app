import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    // Styling is now plain, old-browser-compatible CSS (see src/assets/main.css),
    // so Tailwind is no longer used. The legacy plugin still transpiles the JS for
    // old smart-TV browsers (Samsung Tizen / LG webOS).
    legacy({
      targets: ['chrome >= 56', 'safari >= 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ],
  build: {
    target: 'es2015',
    cssTarget: 'chrome61',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
