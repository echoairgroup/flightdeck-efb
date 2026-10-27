import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const githubPages = process.env.VITE_GITHUB_PAGES === "true";

export default defineConfig({
  base: githubPages ? (process.env.VITE_BASE_PATH || "/flightdeck-efb/") : "/",
  root: resolve(process.cwd(), "client"),
  plugins: [react()],
  build: {
    outDir: resolve(process.cwd(), "client/dist"),
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:10000",
        changeOrigin: true
      }
    }
  }
});
