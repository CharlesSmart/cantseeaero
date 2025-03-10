import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills()
  ],
  build: {
    target: 'esnext', // Allows for top-level await
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "readable-stream": "vite-compatible-readable-stream"
    }
  },
  define: {
    global: {},
  }
});