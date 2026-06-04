# fe-catalog — Marqet catalog remote (React)

The **catalog** micro-frontend of the *Marqet* demo: hero carousel, product grid,
filter chips, and a promo banner. It's a **Module Federation remote** that exposes
a React component (`./App`) which the [shell](https://github.com/GDGoC-BiOn/fe-shell)
renders as a real React child.

> Part of a 3-repo system: **[fe-shell](https://github.com/GDGoC-BiOn/fe-shell)** (host, React) · **fe-catalog** (this) · **[fe-cart](https://github.com/GDGoC-BiOn/fe-cart)** (cart, Vue).
> Live (standalone): https://gdgoc-bion.github.io/fe-catalog/

---

## The system at a glance

| Repo | Stack | Port | Role | Exposes |
|------|-------|------|------|---------|
| fe-shell | React 18 | 3000 | Host — chrome + integrates remotes | — |
| **fe-catalog** (this) | React 18 | 3001 | Remote — hero, product grid, filters | **`./App`** (React component) |
| fe-cart | Vue 3 | 3002 | Remote — cart drawer + state | `./mount` |

Three **separate, independently deployable repos**, wired at runtime via
`remoteEntry.js`. UI from [`@bion-mfe-ui`](https://gdgoc-bion.github.io/bion-mfe-ui).

---

## Architecture

> **You are here: `fe-catalog`** — a React remote the shell renders as a child.

```mermaid
flowchart TD
    user([User / Browser])
    shell["fe-shell — React host (:3000)<br/>header · footer · search · event-bus bridge"]
    catalog["fe-catalog — React remote (:3001)<br/>hero · product grid · filters"]
    cart["fe-cart — Vue remote (:3002)<br/>cart drawer + state"]

    user --> shell
    shell -->|"lazy import('catalog/App') · direct props"| catalog
    catalog -.->|"onAddToCart(product) callback"| shell
    shell ==>|"window event: cart:add-item · cart:open"| cart
    cart ==>|"window event: cart:count (→ header badge)"| shell

    style shell fill:#eef6ff,stroke:#2563eb,stroke-width:2px
    style catalog fill:#eefaf0,stroke:#0a8f54,stroke-width:4px
    style cart fill:#fff4e8,stroke:#b35e0c,stroke-width:2px
```

**Legend** — **solid** = host loads/consumes a remote (same-framework, direct props) · **dashed** = React callback back to the host · **thick** = cross-framework `window` event bus.

### Add-to-cart flow

```mermaid
sequenceDiagram
    actor U as User
    participant C as fe-catalog (React)
    participant S as fe-shell (host)
    participant K as fe-cart (Vue)
    U->>C: click "+" on a product
    C->>S: onAddToCart(product) — React prop (direct)
    S->>K: window "cart:add-item" { product }
    Note over K: add / increment line, open drawer
    K-->>S: window "cart:count" { count }
    Note over S: header badge → "Keranjang (n)"
```

---

## What this remote does

- Renders the **hero carousel**, **product grid** (`PRODUCTS` → `<ProductCard>`),
  **filter chips** (Semua / Audio / Kamera / Wearable), and a **promo banner**,
  all with `@bion-mfe-ui/react`.
- Exposes a single federated entry, **`./App`** → `src/App.tsx`, a React component:

  ```ts
  // what the shell consumes:
  import Catalog from 'catalog/App'
  <Catalog onAddToCart={(product) => …} query={searchText} />
  ```

- **It does not touch the cart.** When a product's **+** is clicked it calls the
  `onAddToCart(product)` **prop** (a plain React callback). The *shell* decides
  what to do with it (it forwards to the Vue cart over the event bus). This keeps
  the React↔React boundary as direct data flow — no event bus here.
- Optional `query` prop filters the grid (wired to the shell's header search).

```
shell  ──props──▶  <Catalog onAddToCart query />     (React → React, direct)
                       │
ProductCard "+"  ──▶  onAddToCart(product)  ──▶  (shell forwards to cart)
```

---

## Quick start

> Requires **Node ≥ 18** and **pnpm**.

```bash
pnpm install
pnpm dev          # http://localhost:3001
```

### Run it standalone

This repo has a **solo dev harness** (`src/standalone.tsx`) so you can build the
catalog in isolation — `pnpm dev` renders the grid on `:3001` without the shell.
`onAddToCart` just logs to the console here.

### Run inside the full app

Start this remote, then the cart, then the shell (the shell loads this over HTTP):

```bash
# this repo
pnpm dev          # :3001  ← start before the shell
# fe-cart
pnpm dev          # :3002
# fe-shell
pnpm dev          # :3000  ← open this
```

### Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Vite dev server + standalone harness on `:3001` |
| `pnpm build` | Production build (emits `remoteEntry.js` + chunks) |
| `pnpm preview` | Serve the build on `:3001` |

---

## Configuration (`.env`)

| Variable | Meaning | Local default |
|----------|---------|---------------|
| `VITE_PUBLIC_URL` | Public origin this remote is served from (Vite `base`). The host resolves its chunks against this, so it **must** serve `/remoteEntry.js` with CORS. | `http://localhost:3001` |
| `VITE_PORT` | Dev/preview server port | `3001` |

Copy `.env.example` → `.env` to override. Falls back to localhost without one.

---

## How it's built (vite.config.ts)

```ts
federation({
  name: "catalog",
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/App.tsx" },
  shared: {                       // consumed from the host as singletons
    react: { singleton: true },
    "react-dom": { singleton: true },
    "react-dom/": { singleton: true },
  },
})
// + vite-plugin-css-injected-by-js  (inline CSS into JS so the host can load
//   this remote's styles cross-origin)
// + build.target: "chrome89"
```

- **`react`/`react-dom` shared singletons** — the catalog must use the *same*
  React instance as the shell to render as a real React child.
- **`lit` + `@bion-mfe-ui/*` are bundled, not shared** (perf: avoids a deep MF
  request waterfall; safe because `@bion-mfe-ui/core@^0.1.2` makes
  `customElements.define` idempotent). See the shell README for the full rationale.

---

## Component contracts used here

From `@bion-mfe-ui/react`:

- `<ProductCard name brand price oldPrice glyph tag rating reviews onAdd … />` —
  **`onAdd` carries `{ name }` only**, so we keep the full product in a closure
  and call `onAddToCart(product)`.
- `<Carousel aspect interval>{slides}</Carousel>` — auto-rotating banner.
- `<Chip value active onSelect>` — filter chips.

Glyph note: `PRODUCTS[].icon` maps 1:1 to the bion `glyph` (`audio|watch|camera|speaker`);
`earbuds` is mapped to `audio`.

---

## Project structure

```
catalog/
├─ index.html            # standalone dev page (#root)
├─ vite.config.ts        # federation remote config (exposes ./App) — env-driven
├─ .env / .env.example
└─ src/
   ├─ App.tsx            # EXPOSED entry — loads tokens css, renders <Catalog/>
   ├─ Catalog.tsx        # hero + grid + chips + promo; PRODUCTS → <ProductCard>
   ├─ products.ts        # the 8 demo products
   ├─ standalone.tsx     # solo dev harness (renders App with a logging callback)
   └─ types.ts           # MarqetProduct + glyphOf()
```

---

## Deployment (GitHub Pages)

`/.github/workflows/deploy.yml` deploys to Pages on push to `main`. **Enable
once:** *Settings → Pages → Source = GitHub Actions.* Built with:

```yaml
env:
  VITE_PUBLIC_URL: https://gdgoc-bion.github.io/fe-catalog/
```

Deploy this **before the shell** the first time, so its `remoteEntry.js` is live
when the shell loads. Same-origin with the shell (`gdgoc-bion.github.io`) → no CORS.

---

## Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| Shell can't load the catalog | This remote not running / wrong `VITE_CATALOG_URL` in the shell / `remoteEntry.js` 404. |
| Styles missing on cards | tokens come from `@bion-mfe-ui/tokens/css` (imported in `App.tsx`) — keep that import. |
| Add button does nothing standalone | Expected — standalone just logs; the real wiring lives in the shell. |
