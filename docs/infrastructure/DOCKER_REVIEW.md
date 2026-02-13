# Docker Infrastructure Review

**Date:** 2026-01-30
**Reviewer:** GitHub Copilot (Docker Expert)
**Scope:** `Dockerfile`, `docker-compose.yml`

## 1. Compliance Scorecard

| Category | Status | Notes |
|----------|:------:|-------|
| **Dockerfile Optimization** | ⚠️ WARN | Missing `.dockerignore`; Layer caching could be improved. |
| **Security Hardening** | ❌ FAIL | Container runs as root; missing security headers/users. |
| **Orchestration** | ⚠️ WARN | App not integrated with Supabase stack; Network isolation unclear. |
| **Image Size** | ✅ PASS | Multi-stage build correctly used (`.output` folder only). |
| **Local Dev** | ⚠️ WARN | No dev-container or hot-reload setup in Compose. |

## 2. Detailed Findings

### Dockerfile Analysis
- **Security High Risk:** The container runs as `root` (default). If the application is compromised, the attacker has root access to the container filesystem.
  - *Fix:* Create a non-root user (e.g., `nodejs` or `nuxt`) and switch to it with `USER`.
- **Performance:** `COPY . .` is used without a `.dockerignore` file (I have just created one for you).
  - *Risk:* `node_modules`, `.git`, and local secrets could be copied into the image.
- **Reliability:** No `HEALTHCHECK` instruction. Orchestrators won't know if the app is actually ready to serve traffic.

### Orchestration (`docker-compose.yml`)
- **Observation:** The current Compose file only manages the Supabase stack.
- **Gap:** The main `fitundfun-web` application is not defined in the services.
  - *Implication:* You have to run the app manually (`npm run dev`) or manage a separate container.
  - *Recommendation:* Add the app to the Compose stack to allow internal networking (e.g., app talking to database via `http://kong:8000` instead of `localhost`).

## 3. Recommended Fixes

### A. Optimized & Hardened Dockerfile
Replace current `Dockerfile` with this production-ready version:

```dockerfile
ARG NODE_VERSION=20.11.0-alpine

# Stage 1: Builder
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci
# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:${NODE_VERSION}
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nuxt -u 1001 -G nodejs
USER nuxt

# Copy only necessary files
COPY --from=builder --chown=nuxt:nodejs /app/.output ./.output

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
```

### B. Add App to Compose
Create `docker-compose.override.yml` to run the app alongside Supabase:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=http://kong:8000
      - SUPABASE_KEY=${ANON_KEY}
    depends_on:
      kong:
        condition: service_started
```

## 4. Immediate Actions Taken
- Created `.dockerignore` to prevent `node_modules` and secrets from leaking into the build context.
