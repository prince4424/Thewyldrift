import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Use the UI at this dev server (e.g. :5173); `/api/*` is forwarded to the Express API.
      "/api": { target: "http://127.0.0.1:8080", changeOrigin: true },
    },
  },
});

