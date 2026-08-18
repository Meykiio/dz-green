import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // TanStack Router plugin must come BEFORE JSX transformation plugins.
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    // maplibre-gl's web worker breaks under dep pre-bundling in dev
    // (maplibre-gl-worker.mjs 404s and every GeoJSON source silently never
    // renders). Excluding it keeps the worker URL intact in dev.
    exclude: ["maplibre-gl"],
  },
});
