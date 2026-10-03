import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// A separate build for a single HTML file opened directly from disk.
export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: "dist-single/.bundle",
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
