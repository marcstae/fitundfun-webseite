# Nuxt Project Review

**Date:** 2026-01-30
**Reviewer:** GitHub Copilot (Nuxt 3 Expert)
**Scope:** `nuxt.config.ts`, Directory Structure, Data Fetching

## 1. Compliance Scorecard

| Category | Status | Notes |
|----------|:------:|-------|
| **Directory Structure** | ✅ PASS | Follows standard Nuxt 3 layout. |
| **Data Fetching** | ✅ PASS | Uses `useAsyncData` correctly for Supabase calls. |
| **Server Routes** | ⚠️ NOTE | `server/api` is empty. No custom endpoints (Relying fully on Supabase Client). |
| **Configuration** | ⚠️ WARN | Supabase keys passed via `process.env` in `nuxt.config.ts` without `runtimeConfig`. |
| **Components** | ✅ PASS | Auto-imports configured; shadcn-vue structure supported. |

## 2. Detailed Findings

### Configuration (`core-config`)
- **Issue:** In `nuxt.config.ts`:
  ```typescript
  supabase: {
    url: process.env.SUPABASE_URL,
    // ...
  }
  ```
  - Direct access to `process.env` in `nuxt.config.ts` works at *build* time, but for runtime Environment Variable replacement (Docker), it's often safer/better to use `runtimeConfig`.
  - However, `@nuxtjs/supabase` module often handles this automatically if `SUPABASE_URL` is set in the environment.
- **Good:** `compatibilityDate` is set.
- **Good:** `redirect: false` in Supabase options prevents auth-loops for public pages.

### Data Fetching & State (`core-data-fetching`)
- **Observation:** `pages/index.vue` uses:
  ```typescript
  const { data: aktuellesLager } = await useAsyncData('aktuelles-lager', ...)
  ```
  - This is excellent practice. It ensures the data is fetched on the server (SSR) and hydrated to the client without a second request.

### Server-Side Logic
- **Observation:** `server/api` is empty.
  - This is acceptable since you are using Supabase as a "Backend-as-a-Service" directly from the frontend/islands.
  - **Suggestion:** If you ever need secret business logic (e.g., sending emails via SMTP, validating complex rules that RLS can't handle), place it here.

## 3. Required Action Items

1.  **Environment Variables:** Verify that `SUPABASE_URL` and `SUPABASE_KEY` / `ANON_KEY` are picked up correctly in the Docker container. (The current `process.env` usage in `nuxt.config.ts` might bake values in at build time if not careful, though Nuxt 3 usually handles `process.env` intelligently).
2.  **Composables:** The `composables/` directory is empty. Consider moving logic like `formatDate` from `index.vue` into a `composables/useFormat.ts` file to make it reusable across the Archive pages.
