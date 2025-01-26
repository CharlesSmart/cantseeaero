import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react()],
  base: "/AeroLens/",
  build: {
    target: 'esnext', // Allows for top-level await
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/app")
    }
  }
});