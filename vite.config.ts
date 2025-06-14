import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import fs from 'fs'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: [
    'buffer'
    ],
  })
  ],
  build: {
    target: 'esnext', 
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
  },
  server: process.env.NODE_ENV === 'development' ? {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    },
    host: '0.0.0.0'
  } : {}
});