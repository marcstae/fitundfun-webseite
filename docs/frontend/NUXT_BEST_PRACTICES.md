# Nuxt 3 Best Practices & Expert Guide

**Based on:** Nuxt 3.x (Generated 2026-01-28)
**Core Engine:** Nitro (Universal Deployment)

## Core Concepts

### Directory Structure
- **`pages/`**: File-based routing. Creating a file here automatically creates a route.
- **`components/`**: Auto-imported Vue components.
- **`composables/`**: Auto-imported logic/functions.
- **`server/`**: Server-side logic (API routes, middleware) powered by Nitro.
- **`layouts/`**: Reusable page wrappers.

### Data Fetching (`core-data-fetching`)
- **`useFetch`**: The most common way to fetch data. Wrapper around `$fetch` + `useAsyncData`.
- **`useAsyncData`**: Wraps an async logic, handles SSR state transfer (hydration).
- **`$fetch`**: Helper for making HTTP requests (user interaction, not initial load).
- **Key Rule:** Always use unique keys for `useAsyncData` if the auto-generated ones aren't stable enough (though Nuxt 3 handles this well mostly).

### State Management (`features-state`)
- **`useState`**: SSR-friendly ref. Replaces `ref` when state needs to be shared across components or preserved during hydration.
- **Pinia**: Recommended for complex global state.

## Best Practices

### 1. Data Fetching
- **Don't** use `fetch()` or `axios` directly in setup. It causes double-fetching (once server, once client). Use `useFetch`.
- **Do** use `lazy: true` in `useFetch` for non-critical data to speed up navigation.

### 2. Auto-imports
- **Do** rely on auto-imports for `Ref`, `Computed`, `watch`, `useRouter`, etc.
- **Do** name components clearly (e.g., `AppHeader.vue` -> `<AppHeader />`).

### 3. Server Routes
- Place API logic in `server/api/`. These are auto-mapped to `/api/...`.
- Use specific HTTP method handlers if needed (e.g., `.get.ts`, `.post.ts`).

### 4. Configuration (`nuxt.config.ts`)
- Use `runtimeConfig` for secrets (server-side) and public keys (`public` key).
- Never hardcode API keys in client-side code.

## Deployment (`core-deployment`)
- Build with `npm run build`.
- Output is in `.output/`.
- Run with `node .output/server/index.mjs`.

## References
- https://nuxt.com/docs
- https://nitro.unjs.io/
