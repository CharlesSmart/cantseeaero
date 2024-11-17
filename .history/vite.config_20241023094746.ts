import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react({
    babel: {
      plugins: ["@onlook/babel-plugin-react"]
    }
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});