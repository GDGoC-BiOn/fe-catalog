import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Shared singletons — lit + bion web components must resolve to one instance
// across every MFE (incl. the Vue cart) or `customElements.define` double-fires.
const bion = {
  lit: { singleton: true },
  "lit/": { singleton: true },
  "@bion-mfe-ui/core": { singleton: true },
  "@bion-mfe-ui/core/": { singleton: true },
  "@bion-mfe-ui/icons": { singleton: true },
  "@bion-mfe-ui/tokens": { singleton: true },
};

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
      federation({
        name: "catalog",
        filename: "remoteEntry.js",
        // Exposes a React component — the shell renders it as a real React child,
        // so add-to-cart flows up through a normal prop callback (no event bus).
        exposes: {
          "./App": "./src/App.tsx",
        },
        shared: {
          react: { singleton: true },
          "react-dom": { singleton: true },
          "react-dom/": { singleton: true },
          ...bion,
        },
      }),
      cssInjectedByJsPlugin(),
    ],
    optimizeDeps: {
      exclude: [
        "@bion-mfe-ui/react",
        "@bion-mfe-ui/core",
        "@bion-mfe-ui/icons",
        "@bion-mfe-ui/tokens",
        "lit",
      ],
    },
    build: { target: "chrome89" },
  };
});
