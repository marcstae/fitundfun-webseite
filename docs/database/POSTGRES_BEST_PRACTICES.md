# Supabase Postgres Best Practices

Comprehensive performance optimization guide for Postgres, maintained by Supabase.

## Rule Categories by Priority

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Query Performance | CRITICAL | query- |
| 2 | Connection Management | CRITICAL | conn- |
| 3 | Security & RLS | CRITICAL | security- |
| 4 | Schema Design | HIGH | schema- |
| 5 | Concurrency & Locking | MEDIUM-HIGH | lock- |
| 6 | Data Access Patterns | MEDIUM | data- |
| 7 | Monitoring & Diagnostics | LOW-MEDIUM | monitor- |
| 8 | Advanced Features | LOW | advanced- |

## Quick Reference

### 1. Query Performance (CRITICAL)
- **Indexes:** Ensure foreign keys and frequently queried columns are indexed.
- **Selectivity:** Avoid `SELECT *`. Select only needed columns.
- **Joins:** Prefer simple joins over complex subqueries or CTEs where possible for simple fetches.

### 2. Connection Management (CRITICAL)
- **Pooling:** Use Transaction Pooling (Supavisor/PgBouncer) for serverless environments (e.g., Nuxt API routes).
- **Timeouts:** Set appropriate statement timeouts to prevent hung connections.

### 3. Security & RLS (CRITICAL)
- **Enable RLS:** Always enable RLS on public tables (`ALTER TABLE x ENABLE ROW LEVEL SECURITY`).
- **Policies:** Define explicit policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
- **Service Key:** Never use the `service_role` key on the client side.

### 4. Schema Design (HIGH)
- **Data Types:** Use appropriate types (e.g., `TIMESTAMPTZ` for dates, `UUID` for IDs).
- **Constraints:** Use `NOT NULL`, `CHECK`, and Foreign Keys to enforce data integrity.

### 5. Data Access Patterns (MEDIUM)
- **Pagination:** Use cursor-based pagination for large datasets instead of `OFFSET/LIMIT`.
- **Batching:** Batch inserts/updates where possible.

## References
- https://www.postgresql.org/docs/current/
- https://supabase.com/docs
- https://wiki.postgresql.org/wiki/Performance_Optimization
