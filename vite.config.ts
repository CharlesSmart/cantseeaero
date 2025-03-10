import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: [
    'buffer'
    ],
    // exclude: [
    //   'fs',
    //   'timers/promises'
    // ],
  })
  ],
  build: {
    target: 'esnext', // Allows for top-level await
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
    }
  },
  define: {
    global: {}
  }
});