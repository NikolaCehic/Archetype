import { defineConfig } from "vite";

export default defineConfig({
  root: "workbench",
  publicDir: "public",
  build: {
    outDir: "../dist-workbench",
    emptyOutDir: true
  },
  server: {
    port: 4173,
    strictPort: false
  }
});
