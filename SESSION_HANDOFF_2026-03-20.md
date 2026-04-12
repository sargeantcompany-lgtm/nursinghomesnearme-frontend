# Session Handoff - 2026-03-20

## Current situation

- The live backend is **not currently healthy** on Railway.
- The original broken JDBC URL issue (`jdbc:postgresql://:/`) was fixed.
- The **current** backend failure is a **Postgres connection timeout** while the Railway Postgres service is still/was still deploying.

## What was proven

- Live facility saves **do write to the real backend database** when the payload is valid.
- The main save blocker was a bad legacy `verifiedAt` value coming from the admin UI.
- This means the save problem is **not** "wrong database" and **not** "frontend-only".

## Important commits

### Frontend

- `770ec7d`
  - Normalizes `verifiedAt` in admin saves.
  - Includes the public facility detail cleanup.

### Backend

- `8c6f503`
  - Accept legacy `verifiedAt` timestamps on facility save.

- `5071ae4`
  - Ignore invalid `verifiedAt` instead of rejecting the whole save.

- `e4967f6`
  - Hardens backend startup when Postgres is slow.

- `77219e4`
  - Safely parses Railway `DATABASE_URL` on startup.

## Railway variables

These backend variables should **not** be present:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

They caused the broken datasource override earlier.

## Latest backend log diagnosis

The latest crash is:

- `SocketTimeoutException: Connect timed out`
- `The connection attempt failed`
- `HikariPool-1 - Connection is not available`

This points to **backend cannot reach Postgres in time**, not malformed JDBC parsing.

## Next steps when resuming

1. Confirm Railway Postgres is no longer showing `Deploying`.
2. Redeploy `nursinghomesnearme_backend`.
3. Confirm backend health before testing the admin UI.
4. Make sure frontend deploy includes `770ec7d`.
5. Test a facility save again.

## Short version to remember tomorrow

- Real save path works.
- Bad `verifiedAt` was the functional save blocker.
- Backend variable advice was wrong and those Spring datasource vars must stay deleted.
- JDBC parsing is fixed now.
- Current blocker is Railway Postgres connection timeout / deployment state.
