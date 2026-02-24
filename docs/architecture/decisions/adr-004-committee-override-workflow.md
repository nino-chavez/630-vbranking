# ADR-004: Committee Override Workflow with Draft/Finalize Lifecycle

## Status

Accepted

## Context

Algorithmic rankings provide an objective baseline, but the committee must retain authority to adjust individual team positions based on qualitative factors that algorithms cannot capture. Examples include:

- A team whose key players were injured for multiple tournaments, depressing their algorithmic ranking.
- Schedule strength disparities where a team in a weak region has inflated wins.
- Head-to-head results between closely ranked teams that the aggregate score does not reflect.

The committee also needs an audit trail: when coaches or parents question a ranking, the committee must explain why a team was moved and who approved the change. Additionally, once rankings are published (used for seeding), they must be immutable to prevent post-publication tampering.

## Decision

The system implements a two-state lifecycle for ranking runs:

### Run States

| State       | Overrides              | Description                                                                |
| ----------- | ---------------------- | -------------------------------------------------------------------------- |
| `draft`     | Create, update, delete | Default state after computation. Committee can review and adjust.          |
| `finalized` | Read-only              | Set via `POST /api/ranking/runs/finalize`. Irreversible. Overrides locked. |

### Override Structure

Each override is stored in the `ranking_overrides` table with the following fields:

| Field              | Type    | Constraint                  | Purpose                                 |
| ------------------ | ------- | --------------------------- | --------------------------------------- |
| `ranking_run_id`   | UUID    | FK to `ranking_runs`        | Associates override with a specific run |
| `team_id`          | UUID    | FK to `teams`               | Identifies the affected team            |
| `original_rank`    | INTEGER | NOT NULL                    | The algorithmic rank before override    |
| `final_rank`       | INTEGER | NOT NULL                    | The committee-assigned rank             |
| `justification`    | TEXT    | CHECK >= 10 chars           | Written rationale for the change        |
| `committee_member` | TEXT    | CHECK >= 2 chars            | Name of the person making the change    |
| Composite unique   |         | `(ranking_run_id, team_id)` | One override per team per run           |

### API Behavior

The overrides API (`/api/ranking/overrides`) enforces state checks:

- **POST (upsert):** Validates that the run is in `draft` status. Returns 403 if the run is finalized.
- **DELETE:** Same draft-status check. Returns 403 if finalized.
- **GET:** Returns overrides for any run regardless of status (read access is always allowed).

### Final Rank Computation

The `computeFinalRanks` function in `src/lib/ranking/table-utils.ts` merges algorithmic ranks with overrides: teams with an override get `override.final_rank`; teams without an override keep their `agg_rank`. The export module uses `computeFinalRanks` to produce the `final_rank` column in CSV, XLSX, and PDF exports.

## Alternatives Considered

**No override capability.** Publish algorithmic rankings as-is. Rejected because it removes committee authority and fails to account for qualitative factors. The AAU ranking process historically involves committee judgment.

**Freeform rank editing without justification.** Allow the committee to drag-and-drop teams to new positions without recording a reason. Rejected because the absence of an audit trail makes rankings indefensible when challenged by coaches or parents.

**Multi-step approval workflow.** Require a second committee member to approve each override before it takes effect. Deferred because the committee is small (under 20 members) and self-governing. The current single-step workflow with mandatory justification provides accountability without bureaucratic overhead. The approval workflow can be added later by introducing an `approved_by` field and a `pending` status.

**Versioned overrides with history.** Store every override change as an immutable event log rather than upsert. Deferred because the `updated_at` timestamp on the override record provides a last-modified audit point, and the draft/finalize lifecycle prevents post-publication changes. Full event sourcing adds complexity disproportionate to the current user base.

## Consequences

**Easier:**

- The committee can adjust rankings transparently with a written justification per change.
- The finalization mechanism prevents accidental edits to published rankings.
- The audit trail (justification + committee_member + timestamps) provides evidence for dispute resolution.
- Exports include override details (original rank, final rank, justification, committee member) for complete transparency.

**More difficult:**

- Finalization is irreversible. To make further changes, the committee must create a new ranking run. This is intentional but requires the committee to understand the workflow.
- The `final_rank` is computed at read time (not stored), so the export module and UI must call `computeFinalRanks` consistently. A mismatch between the dashboard and an export would be a bug.
- The override table allows a team to be assigned any `final_rank`, including duplicates (two teams at rank 3). The system does not enforce unique final ranks -- this is by design, as the committee may intentionally co-rank teams.

## Evidence

- Run status migration: `supabase/migrations/20260223180013_add_ranking_run_status.sql`
- Override table migration: `supabase/migrations/20260223180014_create_ranking_overrides_table.sql`
- Override API (GET/POST/DELETE with status checks): `src/routes/api/ranking/overrides/+server.ts`
- Finalize API: `src/routes/api/ranking/runs/finalize/+server.ts`
- Final rank computation: `src/lib/ranking/table-utils.ts` (`computeFinalRanks`)
- Override Zod schema: `src/lib/schemas/ranking-override.ts`
- Override UI component: `src/lib/components/OverridePanel.svelte`
- Export integration: `src/lib/export/export-data.ts` (`assembleExportRows` uses `computeFinalRanks`)
