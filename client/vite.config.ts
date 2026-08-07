import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL("..", import.meta.url))],
    },
    proxy: {
      "/api": "http://localhost:5000",
      "/health": "http://localhost:5000",
    },
  },
});
