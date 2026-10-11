import { defineConfig } from "vite";

export default defineConfig({
  base: './',
  build: { emptyOutDir: false, rolldownOptions: { input: { classical: 'index.html', causal: 'causal.html', doCalculus: 'do_calculus.html', decision: 'decision.html' } } },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
});
