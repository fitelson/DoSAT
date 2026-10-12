import { defineConfig } from "vite";

export default defineConfig({
  base: './',
  build: { emptyOutDir: false, rolldownOptions: { input: { dosat: 'index.html' } } },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
});
