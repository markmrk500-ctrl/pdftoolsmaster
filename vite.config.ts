import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // qpdf's Emscripten glue references these Node built-ins behind
      // environment checks; stub them out for the browser build.
      fs: path.resolve(__dirname, "./src/lib/emptyModule.ts"),
      path: path.resolve(__dirname, "./src/lib/emptyModule.ts"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    // CommonJS module — let esbuild convert it so the worker can import it.
    include: ["@neslinesli93/qpdf-wasm"],
  },
  worker: {
    format: "es",
  },
}));
