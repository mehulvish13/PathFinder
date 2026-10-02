import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// PathFinder frontend — talks directly to the FastAPI backend via VITE_API_BASE_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  preview: {
    port: 4173,
  },
});
