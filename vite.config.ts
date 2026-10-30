import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5176,
    strictPort: true,
    watch: { ignored: ['**/android/**', '**/tools/.cache/**', '**/release/**', '**/test-results/**', '**/docs/screenshots/**', '**/docs/*-audit.json'] }
  }
});
