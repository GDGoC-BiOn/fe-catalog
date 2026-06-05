import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const port = Number(env.VITE_PORT) || 3001;
  const publicUrl = env.VITE_PUBLIC_URL || `http://localhost:${port}`;

  return {
    base: publicUrl,
    server: { port, strictPort: true, origin: publicUrl, cors: true },
    preview: { port, strictPort: true, cors: true },
    plugins: [
      react(),
      // DEMO Act 2 — uncomment to expose the catalog as a remote (./App).
      // Until then catalog runs solo at :3001 via src/standalone.tsx (no remoteEntry.js).
      // federation({
      //   name: "catalog",
      //   filename: "remoteEntry.js",
      //   // Exposes a React component — the shell renders it as a real React child,
      //   // so add-to-cart flows up through a normal prop callback (no event bus).
      //   exposes: {
      //     "./App": "./src/App.tsx",
      //   },
      //   // Only React is shared (consumed from the host as a singleton so the
      //   // catalog renders as a real React child). lit + @bion-mfe-ui are bundled
      //   // here, not shared — see the shell config for why (collapses the MF
      //   // request waterfall; double-define is guarded by core@^0.1.2).
      //   shared: {
      //     react: { singleton: true },
      //     "react-dom": { singleton: true },
      //     "react-dom/": { singleton: true },
      //   },
      // }),
      cssInjectedByJsPlugin(),
    ],
    build: { target: "chrome89" },
  };
});
