import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  // TanStack Router plugin must come BEFORE JSX transformation plugins.
  plugins: [
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      server: { entry: "server" },
    }),
    // Emits a Vercel-compatible server build (SSR + server functions). Without
    // it Vercel serves only static files and every route 404s.
    nitro(),
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
