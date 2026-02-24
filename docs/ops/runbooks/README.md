# Operational Runbooks

> Last updated: 2026-02-24

This document contains step-by-step runbooks for diagnosing and resolving common operational issues with the Volleyball Ranking Engine.

---

## Table of Contents

1. [Database Migration Failure](#1-database-migration-failure)
2. [Import Data Corruption](#2-import-data-corruption)
3. [Ranking Discrepancy Investigation](#3-ranking-discrepancy-investigation)
4. [Supabase Connection Issues](#4-supabase-connection-issues)

---

## 1. Database Migration Failure

### Symptom

`supabase db push` exits with an error. The error message references a specific migration file, a SQL syntax error, a constraint violation, or a timeout.

### Impact

- New schema changes are not applied to the production database.
- The application may be running against an outdated schema, causing runtime errors if new code references columns or tables that do not exist.
- Subsequent migrations are blocked until the failing migration is resolved.

### Diagnosis Steps

1. Read the full error output from `supabase db push`. Note the migration filename and the specific SQL error.
2. Check which migrations have been applied:
   ```bash
   supabase migration list
   ```
3. Identify the failing migration file in `supabase/migrations/` and review the SQL.
4. Test the migration locally by resetting the local database:
   ```bash
   supabase db reset
   ```
5. If the local reset succeeds but the remote push fails, the remote database may have diverged from the expected state. Connect to the remote database and inspect the schema:
   ```bash
   supabase db remote status
   ```
6. Check for conflicting manual schema changes applied directly through the Supabase Dashboard SQL editor.

### Resolution

**If the migration has a SQL syntax error:**

1. Fix the SQL in the migration file.
2. If the migration has not been applied to any environment, edit it in place.
3. If the migration was partially applied, write a corrective migration and apply it.

**If the migration conflicts with existing data:**

1. Identify the constraint violation (e.g., NOT NULL on a column with NULL values).
2. Write a data backfill step before the constraint change, or add a DEFAULT value.
3. Test locally with `supabase db reset`.
4. Push to production with `supabase db push`.

**If the remote schema has diverged:**

1. Generate a diff to understand the current remote state:
   ```bash
   supabase db diff
   ```
2. Reconcile the differences by writing a migration that brings the remote schema in line with the expected state.
3. Apply with `supabase db push`.

### Prevention

- Always test migrations locally with `supabase db reset` before pushing to production.
- Never modify the database schema through the Supabase Dashboard SQL editor in production. Use migrations exclusively.
- Write backward-compatible migrations (add columns with defaults rather than renaming or dropping).
- Include data backfills in the same migration as schema changes that require them.

---

## 2. Import Data Corruption

### Symptom

After an XLSX file import, ranking computations produce unexpected results. Possible indicators:

- Teams appear with incorrect tournament placements.
- Duplicate team entries exist for the same code + age group.
- Tournament results reference nonexistent tournaments or teams.
- The import confirmation endpoint returns success, but ranking data is inconsistent.

### Impact

- Ranking computations use incorrect input data, producing inaccurate rankings.
- Committee trust in the system is undermined.
- If not caught early, corrupted data may propagate into finalized ranking runs and exported reports.

### Diagnosis Steps

1. Identify the import that introduced the corruption. Check the `created_at` timestamps on `tournament_results` rows:
   ```sql
   SELECT DISTINCT created_at::date, count(*)
   FROM tournament_results
   GROUP BY created_at::date
   ORDER BY created_at::date DESC;
   ```
2. Examine the affected tournament results for anomalies:
   ```sql
   SELECT tr.*, t.name AS team_name, tn.name AS tournament_name
   FROM tournament_results tr
   JOIN teams t ON t.id = tr.team_id
   JOIN tournaments tn ON tn.id = tr.tournament_id
   WHERE tr.created_at > '<suspect_timestamp>'
   ORDER BY tn.name, tr.finish_position;
   ```
3. Check for duplicate teams that should have been resolved by identity resolution:
   ```sql
   SELECT code, age_group, count(*), array_agg(name)
   FROM teams
   GROUP BY code, age_group
   HAVING count(*) > 1;
   ```
   (This should return no rows due to the `uq_teams_code_age_group` constraint, but check for near-duplicates with different codes.)
4. Verify field sizes match the number of teams in each tournament:
   ```sql
   SELECT tournament_id, field_size, count(*) AS actual_teams
   FROM tournament_results
   GROUP BY tournament_id, field_size
   HAVING count(*) != field_size;
   ```
5. Review the original XLSX file for formatting issues (missing columns, inconsistent team names, incorrect sheet structure).

### Resolution

**If corrupted data is limited to tournament results for a specific season and age group:**

1. Re-import the corrected XLSX file. The `import_replace_tournament_results` RPC function atomically deletes all existing results for the season + age group and re-inserts, so a clean re-import resolves the issue.
2. Re-run rankings for the affected season and age group via `POST /api/ranking/run`.

**If corrupted data has propagated to ranking runs:**

1. Delete the affected ranking runs (cascade will remove `ranking_results` and `ranking_overrides`):
   ```sql
   DELETE FROM ranking_runs WHERE id = '<affected_run_id>';
   ```
2. Re-import the corrected source data.
3. Re-run the ranking computation.
4. If committee overrides existed on the deleted run, reapply them manually.

**If team identity resolution failed (wrong team matched):**

1. Identify the incorrectly matched team and the correct team.
2. Update the `tournament_results` rows to point to the correct `team_id`.
3. Re-run rankings for the affected season and age group.

### Prevention

- Review the import preview carefully before confirming. The two-phase import (upload preview, then confirm) exists specifically to catch issues before they reach the database.
- Validate XLSX files against the expected format before uploading.
- After each import, spot-check a few known tournament results to verify accuracy.
- Maintain a consistent naming convention in source XLSX files to improve identity resolution accuracy.

---

## 3. Ranking Discrepancy Investigation

### Symptom

A team's computed rank does not match expectations. The committee or a user reports that a team is ranked too high or too low relative to their tournament performance.

### Impact

- Loss of committee confidence in the ranking system.
- Potential need to delay or retract published rankings.
- If the discrepancy is in a finalized run, correcting it requires creating a new run.

### Diagnosis Steps

1. Retrieve the team's ranking breakdown for the specific run:

   ```
   GET /api/ranking/team/<team_id>
   ```

   This returns all five algorithm scores (Colley, Elo-2200, Elo-2400, Elo-2500, Elo-2700), the normalized scores, and the aggregate rating.

2. Check the individual algorithm scores in the database:

   ```sql
   SELECT rr.*, t.name AS team_name
   FROM ranking_results rr
   JOIN teams t ON t.id = rr.team_id
   WHERE rr.ranking_run_id = '<run_id>'
     AND rr.team_id = '<team_id>';
   ```

3. Examine the team's tournament results that fed into the ranking:

   ```sql
   SELECT tr.finish_position, tr.field_size, tr.division,
          tn.name AS tournament_name, tw.weight, tw.tier
   FROM tournament_results tr
   JOIN tournaments tn ON tn.id = tr.tournament_id
   LEFT JOIN tournament_weights tw ON tw.tournament_id = tn.id
   WHERE tr.team_id = '<team_id>'
     AND tn.season_id = '<season_id>'
   ORDER BY tn.date;
   ```

4. Check the team's match record for Colley and Elo calculations:

   ```sql
   SELECT m.*, ta.name AS team_a_name, tb.name AS team_b_name
   FROM matches m
   JOIN teams ta ON ta.id = m.team_a_id
   JOIN teams tb ON tb.id = m.team_b_id
   WHERE (m.team_a_id = '<team_id>' OR m.team_b_id = '<team_id>')
     AND m.tournament_id IN (
       SELECT id FROM tournaments WHERE season_id = '<season_id>'
     )
   ORDER BY m.created_at;
   ```

5. Check whether tournament weights are affecting the outcome disproportionately:

   ```sql
   SELECT tn.name, tw.weight, tw.tier
   FROM tournament_weights tw
   JOIN tournaments tn ON tn.id = tw.tournament_id
   WHERE tw.season_id = '<season_id>'
   ORDER BY tw.weight DESC;
   ```

6. Compare the team's rank to nearby teams to determine whether the discrepancy is a relative issue:

   ```sql
   SELECT rr.agg_rank, rr.agg_rating, t.name,
          rr.algo1_rank, rr.algo2_rank, rr.algo3_rank,
          rr.algo4_rank, rr.algo5_rank
   FROM ranking_results rr
   JOIN teams t ON t.id = rr.team_id
   WHERE rr.ranking_run_id = '<run_id>'
   ORDER BY rr.agg_rank
   LIMIT 20 OFFSET <nearby_rank - 5>;
   ```

7. Check for committee overrides on the run:
   ```sql
   SELECT ro.*, t.name AS team_name
   FROM ranking_overrides ro
   JOIN teams t ON t.id = ro.team_id
   WHERE ro.ranking_run_id = '<run_id>'
   ORDER BY ro.final_rank;
   ```

### Resolution

**If the data is correct and the rank reflects the algorithm:**

- Explain the ranking methodology to the committee. The five-algorithm ensemble (Colley + 4 Elo variants) can produce counterintuitive results when one algorithm disagrees with the others.
- If the committee disagrees, apply a ranking override via `POST /api/ranking/overrides` with a justification.

**If tournament weights are skewing results:**

- Adjust weights via `PUT /api/ranking/weights`.
- Re-run the ranking computation.

**If source data is incorrect:**

- Follow the [Import Data Corruption](#2-import-data-corruption) runbook.

**If an algorithm bug is suspected:**

- Review the ranking engine source code in `src/lib/ranking/`.
- Create a minimal test case with known inputs and expected outputs.
- File a bug report with the test case and the divergent output.

### Prevention

- After each ranking run, compare results to the previous run and investigate significant rank changes.
- Maintain a set of "golden" test datasets with known expected rankings for regression testing.
- Document tournament weight decisions and review them with the committee before running rankings.

---

## 4. Supabase Connection Issues

### Symptom

The application fails to load data, displays empty rankings, or returns API errors. Error messages may include:

- `FetchError: request to https://<project-ref>.supabase.co/rest/v1/... failed`
- `AuthRetryableFetchError`
- `PostgrestError: connection refused` or timeout errors
- Browser console shows `401 Unauthorized` or `403 Forbidden`

### Impact

- The application is partially or fully non-functional.
- Users cannot view rankings, import data, or run ranking computations.
- If the issue is intermittent, some API calls succeed while others fail, leading to inconsistent UI state.

### Diagnosis Steps

1. Verify the Supabase project is online. Open the Supabase Dashboard at `https://supabase.com/dashboard/project/<project-ref>` and check the project status.

2. Test direct API connectivity:

   ```bash
   curl -s -o /dev/null -w "%{http_code}" \
     "https://<project-ref>.supabase.co/rest/v1/" \
     -H "apikey: <publishable-key>" \
     -H "Authorization: Bearer <publishable-key>"
   ```

   Expected: HTTP 200. If 401 or 403, the API key is invalid.

3. Check environment variables in the deployment:
   - Verify `PUBLIC_SUPABASE_URL` points to the correct project.
   - Verify `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is the current publishable key (not rotated).
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is the current service role key.

4. Check the Supabase project's API settings for recent key rotations. Navigate to Dashboard > Settings > API and compare the displayed keys to the configured environment variables.

5. Check for Supabase service incidents at [status.supabase.com](https://status.supabase.com).

6. Test database connectivity from the Supabase SQL editor:

   ```sql
   SELECT 1;
   ```

   If this fails, the database instance itself may be down.

7. Check for connection pool exhaustion in the Supabase Dashboard > Database > Connection Pooler section. Look for:
   - High number of active connections.
   - Connections in "idle in transaction" state.

8. If using the local Supabase instance for development, verify it is running:
   ```bash
   supabase status
   ```
   Start it if needed:
   ```bash
   supabase start
   ```

### Resolution

**If the Supabase project is paused (free tier):**

1. Open the Supabase Dashboard.
2. Click "Restore project" to resume the instance.
3. Wait for the project to become available (typically 1-2 minutes).
4. Verify connectivity with a test query.

**If API keys have been rotated:**

1. Obtain the new keys from Dashboard > Settings > API.
2. Update `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment.
3. Redeploy the application (or restart the server if using Node adapter).

**If there is a Supabase service incident:**

1. Monitor [status.supabase.com](https://status.supabase.com) for updates.
2. There is no action to take other than wait for Supabase to resolve the issue.
3. Communicate the outage to users.

**If the connection pool is exhausted:**

1. Check for long-running queries or transactions in the Supabase Dashboard.
2. Terminate idle connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle in transaction'
     AND query_start < now() - interval '5 minutes';
   ```
3. If this is a recurring issue, consider enabling connection pooling in `supabase/config.toml`:
   ```toml
   [db.pooler]
   enabled = true
   pool_mode = "transaction"
   default_pool_size = 20
   max_client_conn = 100
   ```

**If the local Supabase instance is not running:**

1. Start it:
   ```bash
   supabase start
   ```
2. If it fails to start, check Docker is running and has sufficient resources.
3. Reset the local instance if it is in a broken state:
   ```bash
   supabase stop --no-backup && supabase start
   ```

### Prevention

- Monitor the Supabase Dashboard regularly for connection pool metrics and query performance.
- Set up alerts in the Supabase Dashboard for database health indicators.
- Pin the Supabase project to a paid plan to avoid automatic pausing.
- Store API keys in a secrets manager rather than environment files to simplify rotation.
- Subscribe to Supabase status notifications at [status.supabase.com](https://status.supabase.com).
