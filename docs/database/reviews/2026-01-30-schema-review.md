# Database Schema Review: Initial Assessment

**Date:** 2026-01-30
**Reviewer:** GitHub Copilot (Supabase Expert)
**Scope:** `fitundfun/volumes/db/init/01-schema.sql`

## 1. Compliance Scorecard

| Category | Status | Notes |
|----------|:------:|-------|
| **Schema Design** | ⚠️ WARN | `preis` column uses `TEXT`. |
| **Security (RLS)** | ✅ PASS | RLS enabled on all tables with explicit policies. |
| **Indexing** | ✅ PASS | Critical Foreign Keys and Filter columns are indexed. |
| **Data Types** | ✅ PASS | UUIDs used for PKs; Timestamps correct. |
| **Constraints** | ✅ PASS | `ON DELETE CASCADE` handles cleanups correctly. |

## 2. Detailed Findings

### Schema Design (`schema-design`)
- **Issue:** `public.lager` table uses `preis TEXT`.
  - *Risk:* Prevents mathematical operations or sorting by price securely. Limits flexibility if "Early Bird" logic is needed later.
  - *Recommendation:* If the field contains complex formatting (e.g., "Erw: CHF 200, Kind: CHF 100"), consider structured data (JSONB) or separate columns. If it's just a number, change to `INTEGER` (cents) or `DECIMAL`.

### Query Performance (`query-perf`)
- **Observation:** Frontend code (`pages/index.vue`) does `select('*')`.
  - *Context:* The `lager` table has a `beschreibung` TEXT field which could be large.
  - *Recommendation:* Explicitly select columns needed for the landing page (`id`, `jahr`, `datum_von`, `datum_bis`) to reduce payload size.

### Security & Access (`security-rls`)
- **Strength:** Excellent RLS setup.
  - Public tables are readable by everyone (`true`).
  - Admin tables are writeable only by `authenticated` role.
- **Note:** Ensure Supabase Auth "Enable Signups" is **disabled** in the dashboard/config. If signups are open, anyone can create an account and become an "Admin" because the policy checks `auth.role() = 'authenticated'` without checking a specific `is_admin` flag or user whitelist.

## 3. Required Action Items

1.  **Verify Admin Access:** Confirm that User Signups are disabled in Supabase, or add a specific email whitelist to the RLS policies (e.g., `auth.email() IN ('admin@fitundfun.ch')`).
2.  **Frontend Optimization:** Update `index.vue` to select specific columns.
3.  **Schema Refinements:** Consider migrating `preis` to a clearer structure if calculations are ever expected.
