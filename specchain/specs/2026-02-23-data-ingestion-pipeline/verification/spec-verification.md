# Specification Verification Report

**Feature:** Data Ingestion Pipeline (Feature 2)
**Date:** 2026-02-23
**Execution Profile:** squad / standard
**Verifier:** spec-verifier

---

## Check 1: Requirements Accuracy

Verify all 8 user answers from the Q&A session are accurately captured in `planning/requirements.md`.

| Q# | User Answer (Raw) | Captured in requirements.md | Accurate? | Notes |
|----|-------------------|----------------------------|-----------|-------|
| Q1 | "All three" -- Finishes .xlsx, Colley .xlsx, and CSV match data. Full flexibility. | Yes. Q1 answer lists all three formats: Finishes .xlsx, Colley .xlsx, and plain CSV for match-level data. "Full flexibility for all data types." | PASS | Accurately captured with the exact scope of each format. |
| Q2 | "Defer match ingestion" -- Focus on tournament results only. Match ingestion is a separate future concern. | Yes. Q2 states "Defer match ingestion. This feature focuses on tournament results from the Finishes spreadsheet. Match ingestion will be handled separately in a future feature. The CSV match format should be architecturally supported but not implemented in this spec." | PASS | Correctly captures the defer decision and adds the architectural note about interface-only support. |
| Q3 | "Adaptive (Recommended)" -- Auto-detect tournament boundaries by scanning for Div/Fin/Tot patterns. Skip empty columns. Handle merged cells gracefully. | Yes. Q3 states "Adaptive parsing. Auto-detect tournament column boundaries by scanning for Div/Fin/Tot patterns in Row 2." Also documents observed irregularities from the reference spreadsheet (padding columns, header-only tournaments, merged cells). | PASS | Enriched with specific structural observations from the reference spreadsheet. This is additive and accurate. |
| Q4 | "Preview & map" -- Show unmatched entities in a mapping UI where the user can create new records or map to existing ones before import. | Yes. Q4 states "Preview & map. Show unmatched entities in a mapping UI where the user can: Create a new team/tournament record, Map to an existing record, Skip the unmatched row. Import does not proceed until all identity conflicts are resolved." | PASS | Faithfully captures the three options (create, map, skip) and the blocking condition. |
| Q5 | "User choice at upload" -- Let the uploader pick 'Replace all' vs 'Merge/update' at upload time. | Yes. Q5 states "User choice at upload time. Present two options: Replace all / Merge/update." Includes details on behavior of each mode. | PASS | Accurately captured. Merge mode detail ("Never auto-delete existing records") is a reasonable inference from the user's "merge/update" answer. |
| Q6 | "Ignore and recompute (Recommended)" -- Don't import summary columns. Recompute all aggregates from raw tournament results. | Yes. Q6 states "Ignore and recompute. Do not import the summary columns...All aggregates will be recomputed from the raw tournament result data. Single source of truth." Lists specific columns to ignore. | PASS | Accurately captured with the explicit list of ignored columns. |
| Q7 | "Preview with errors" -- Show parsed data in a table with flagged rows. Let user correct, skip, or resolve errors before confirming import. | Yes. Q7 states "Preview with errors. Show the full parsed data in a table with flagged/highlighted rows" and lists error types (unknown team codes, duplicate entries, invalid data, tournaments with no sub-headers). | PASS | Enriched with specific error types. Accurate to the user's intent. |
| Q8 | "Both UI + API" -- Web UI page with drag-and-drop for committee members, plus API endpoint for automation. User selects season + age group. | Yes. Q8 states "Both UI + API: Web UI (drag-and-drop or file picker page for committee members), API endpoint (programmatic endpoint). User selects season and age group." Also adds "The system should NOT infer age group from file content." | PASS | Accurately captured. The no-inference constraint is a valuable clarification consistent with explicit selection. |

**Check 1 Result: PASS** -- All 8 user answers are accurately and faithfully captured in requirements.md. Enrichments (specific column lists, structural observations, error types) are additive clarifications that do not contradict the user's answers.

---

## Check 2: Visual Assets

Check if `planning/visuals/` exists and has files.

- Directory exists: **Yes** -- `planning/visuals/` directory is present.
- Contains files: **No** -- The directory is empty (0 files).
- `requirements.md` states: "No visual assets provided."

**Check 2 Result: PASS** -- The visuals directory exists but is empty, which is consistent with the "No visual assets provided" note in requirements.md. No discrepancy.

---

## Check 3: Visual Design Tracking

If visuals exist, verify they are referenced in the spec.

- No visual asset files exist in `planning/visuals/`.
- The spec (`spec.md`) includes an ASCII wireframe of the `/import` page layout under the "Visual Design" section. This wireframe is original to the spec (not based on external visual assets).
- The spec also documents 7 UI states (Initial, Parsing, Identity Resolution, Ready to Import, Importing, Complete, Error).

**Check 3 Result: PASS (N/A)** -- No external visuals to reference. The spec provides its own inline wireframe, which is appropriate for a standard-depth execution profile.

---

## Check 4: Requirements Deep Dive

### Explicit Features
1. File upload endpoint (both Web UI and API)
2. Adaptive Excel parser for Finishes format (Div/Fin/Tot detection)
3. Colley format parser (fixed 16-column layout)
4. CSV match parser interface (architecture only, deferred)
5. Team identity resolution (create, map, skip)
6. Tournament identity resolution (create, map, skip)
7. Data validation against Zod schemas and business rules
8. Error preview table with flagged rows
9. Import mode selection (Replace all vs. Merge/update)
10. Context selection (season + age group, not inferred)
11. Summary columns ignored, recomputed from raw data
12. Replace mode: atomic delete + insert
13. Merge mode: insert new, update changed, skip identical

### Constraints
- File format restricted to .xlsx (CSV deferred)
- Age group must NOT be inferred from file content
- Import blocked until all identity conflicts resolved
- Merge mode must never auto-delete existing records
- Summary/computed columns are never imported

### Out-of-Scope Items (from requirements.md)
1. CSV match data ingestion implementation (architecture only)
2. Actual match record creation
3. Summary column import
4. Automated file watching or scheduled imports
5. Auth/permissions on upload endpoint
6. Multi-sheet parsing within a single .xlsx file
7. Age group inference from file content

### Reusability Opportunities (from requirements.md)
1. Existing Zod schemas: `tournamentResultInsertSchema`, `teamInsertSchema`, `tournamentInsertSchema`
2. Supabase client patterns from `src/lib/supabase.ts`
3. `xlsx` library (SheetJS) for Excel parsing
4. `csv-parse` library for CSV parsing

**Check 4 Result: PASS** -- Requirements are comprehensive, well-organized, and clearly delineate in-scope features, constraints, out-of-scope items, and reusability opportunities.

---

## Check 5: Core Specification Validation

### Goal Alignment
- **Requirements goal:** Build a file upload and parsing system for Excel/CSV files, map columns, validate data integrity, persist to database.
- **Spec goal:** Build a file upload and parsing system that accepts Excel (.xlsx) files in two known formats (Finishes and Colley), auto-detects column structure, validates parsed data, provides preview-and-resolve UI for identity conflicts, and persists tournament results and ranking data to Supabase -- with extensible path toward CSV match ingestion.
- **Verdict:** PASS. Spec goal faithfully extends the requirements goal with appropriate specificity.

### User Stories
The spec defines 7 user stories covering:
- Upload Finishes spreadsheet (committee member)
- Upload Colley spreadsheet (committee member)
- Preview with error highlighting (committee member)
- Map unrecognized entities (committee member)
- Choose replace vs merge (committee member)
- Select season and age group explicitly (committee member)
- Programmatic API endpoint (system integrator)

All 7 stories trace directly to user answers (Q1, Q3, Q4, Q5, Q7, Q8). **PASS.**

### Core Requirements Traceability
| Requirement (from requirements.md) | Spec Section | Covered? |
|-------------------------------------|-------------|----------|
| File upload (UI + API) | F1: File Upload | Yes |
| Adaptive Excel parser | F3: Adaptive Finishes Parser | Yes |
| Colley format parser | F4: Colley Format Parser | Yes |
| CSV match parser (architecture only) | F5: CSV Match Parser | Yes |
| Team identity resolution | F6: Identity Resolution | Yes |
| Tournament identity resolution | F6: Identity Resolution | Yes |
| Data validation | F7: Data Validation and Error Preview | Yes |
| Error preview | F7: Data Validation and Error Preview | Yes |
| Import mode selection | F8: Import Mode Selection | Yes |
| Replace mode (atomic) | F8 + Technical Approach | Yes |
| Merge mode | F8 + Technical Approach | Yes |
| Context selection (season + age group) | F2: Context Selection | Yes |
| Summary columns ignored | F3 (trailing summary columns), Out of Scope | Yes |

**All functional requirements are covered in the spec.**

### Out-of-Scope Alignment
| Out-of-Scope (requirements.md) | Spec Out-of-Scope | Covered? |
|-------------------------------|-------------------|----------|
| CSV match data implementation | Yes | Yes |
| Match record creation | Yes | Yes |
| Summary column import | Yes | Yes |
| Automated/scheduled imports | Yes | Yes |
| Auth/permissions | Yes | Yes |
| Multi-sheet parsing | Yes | Yes |
| Age group inference | Yes | Yes |

The spec adds two additional out-of-scope items not in requirements.md:
- "Tournament date extraction" -- Appropriate addition noting the Finishes spreadsheet lacks tournament dates.
- "Bulk team/tournament management" -- Appropriate boundary clarification.

**PASS** -- All out-of-scope items align, and additions are justified.

### Reusability Alignment
| Reusability (requirements.md) | Spec Reusable Components Table | Referenced? |
|-------------------------------|-------------------------------|-------------|
| `tournamentResultInsertSchema` | Yes -- `$lib/schemas/tournament-result.ts` | Yes |
| `teamInsertSchema` | Yes -- `$lib/schemas/team.ts` | Yes |
| `tournamentInsertSchema` | Yes -- `$lib/schemas/tournament.ts` | Yes |
| Supabase client (`src/lib/supabase.ts`) | Yes -- `$lib/supabase.ts` | Yes |
| `xlsx` library | Yes -- mentioned in Technical Approach | Yes |
| `csv-parse` library | Not mentioned in spec (CSV deferred) | Acceptable |

The spec also correctly references `rankingResultInsertSchema` (`$lib/schemas/ranking-result.ts`), `AgeGroup` enum (`$lib/schemas/enums.ts`), and `Database` types (`$lib/types/database.types.ts`) -- all of which exist in the Feature 1 codebase. **Verified against actual files.**

**Check 5 Result: PASS** -- Spec goal, user stories, core requirements, out-of-scope items, and reusability all align with requirements.md. No gaps or contradictions found.

---

## Check 6: Task List Validation

### Test Count Limits (2-8 per group, 10 max for testing-engineer)

| Group | Tests Written | Within 2-8 Limit? |
|-------|--------------|-------------------|
| Group 1 (Parsing & Types) | 8 (5 Finishes + 3 Colley) | PASS (exactly 8) |
| Group 2 (Import Service & API) | 6 | PASS |
| Group 3 (Frontend UI) | 4 | PASS |
| Group 4 (Testing Engineer) | Up to 10 | PASS (at the limit) |

**Total tests: 18 (Groups 1-3) + up to 10 (Group 4) = up to 28.** Within bounds.

### Reusability References in Tasks
| Reusable Asset | Referenced In Tasks? | Where? |
|---------------|---------------------|--------|
| `tournamentResultInsertSchema` | Yes | Task 2.2 (validate Finishes rows), Task 4.2 (Zod integration tests), Summary table |
| `rankingResultInsertSchema` | Yes | Task 2.2 (validate Colley rows), Task 4.2, Summary table |
| `teamInsertSchema` | Yes | Task 2.6 (confirm endpoint identity resolution), Summary table |
| `tournamentInsertSchema` | Yes | Task 2.6 (confirm endpoint), Summary table |
| `AgeGroup` enum | Yes | Task 2.5 (validate age_group param), Task 3.5 (selector), Summary table |
| Supabase client | Yes | Task 2.1, 2.2, 2.5, 2.6, 2.7, Summary table |
| `Database` types | Yes | Summary table |

**PASS** -- All reusable assets from Feature 1 are referenced with specific file paths and usage context.

### Task Specificity
Each sub-task includes:
- A specific file to create or modify (exact path)
- Detailed implementation instructions (what to implement, not just what to achieve)
- Clear input/output contracts (types, method signatures)
- References to existing code where applicable

**PASS** -- Tasks are specific and actionable.

### Traceability (Tasks -> Spec Requirements)

| Spec Requirement | Task(s) |
|-----------------|---------|
| F1: File Upload | 3.1 (FileDropZone), 2.5 (upload endpoint), 3.5 (import page) |
| F2: Context Selection | 2.7 (server load), 3.5 (selectors) |
| F3: Adaptive Finishes Parser | 1.2, 1.7 |
| F4: Colley Format Parser | 1.3, 1.8 |
| F5: CSV Match Parser (interface) | 1.4 |
| F6: Identity Resolution | 2.1 (service), 3.2 (UI panel) |
| F7: Data Validation & Error Preview | 2.2 (validation), 2.4 (duplicate detection), 3.3 (preview table), 4.2 (Zod integration tests) |
| F8: Import Mode Selection | 2.2 (replace/merge logic), 2.3 (atomic RPC), 3.5 (mode selector) |
| F9: Database Persistence | 2.2, 2.3, 2.5, 2.6 |
| F10: Import Summary | 3.4 (ImportSummary component) |
| NF1: Performance | Not explicitly tasked (implicit in parser implementation) |
| NF2: File size limit | 3.1 (FileDropZone maxSizeMB), 2.5 (server-side rejection) |
| NF3: Error resilience | 4.3 (malformed file tests) |
| NF4: Type safety | 1.1 (types), 2.2 (Zod validation) |
| NF5: Accessibility | 3.1 (keyboard-navigable, non-color-only errors) |
| NF6: Responsiveness | 3.6 (layout styling >= 1024px) |

**PASS** -- All spec requirements have at least one corresponding task. No orphaned requirements.

### Scope Verification
- No task introduces functionality outside the spec's scope.
- CSV match parser (Task 1.4) is correctly scoped to interface-only, matching spec F5.
- Auth/permissions are not implemented in any task, matching out-of-scope.
- No multi-sheet parsing logic exists in any task, matching out-of-scope.

**PASS** -- Tasks stay within spec scope.

### Task Count Per Group

| Group | Sub-tasks | Reasonable? |
|-------|----------|-------------|
| Group 1 | 8 (1.1-1.8) | Yes -- types, 2 parsers, 1 interface, barrel export, fixtures, 2 test files |
| Group 2 | 8 (2.1-2.8) | Yes -- identity resolver, import service, RPC, duplicate detector, 2 endpoints, page server, tests |
| Group 3 | 7 (3.1-3.7) | Yes -- 4 components, page, styling, tests |
| Group 4 | 6 (4.1-4.6) | Yes -- audit, 3 test files, E2E, verification |

**Total: 29 sub-tasks.** Reasonable for a standard-depth squad execution.

**Check 6 Result: PASS** -- All test limits respected, reusability referenced, tasks are specific and traceable, scope is maintained, task counts are reasonable.

---

## Check 7: Reusability and Over-Engineering Check

### Unnecessary New Components
Review of new components proposed in the spec and tasks:

| New Component | Justified? | Rationale |
|--------------|-----------|-----------|
| FinishesParser | Yes | Core feature requirement. No existing parser. |
| ColleyParser | Yes | Core feature requirement. No existing parser. |
| MatchFileParser (interface) | Yes | Architecture-only per user Q2. Minimal cost (types only). |
| ParseResult types | Yes | Shared across all parsers and the import service. |
| IdentityResolver | Yes | Core feature (Q4). Fuzzy matching is domain-specific logic. |
| ImportService | Yes | Orchestrates validation + replace/merge logic. Justified complexity. |
| FileDropZone | Yes | Reusable UI component. No existing file upload component in the codebase. |
| IdentityResolutionPanel | Yes | Feature-specific UI for Q4 requirement. |
| DataPreviewTable | Yes | Feature-specific UI for Q7 requirement. |
| ImportSummary | Yes | Simple display component for import results. |
| Import page | Yes | Required page route for the feature. |
| Upload API endpoint | Yes | Core feature (Q8). |
| Confirm API endpoint | Yes | Separates parsing from persistence. Good architectural decision. |
| Supabase RPC function | Yes | Required for atomic replace-mode transactions (Supabase JS client limitation). |
| DuplicateDetector (separate utility) | Borderline | Could be a method on ImportService rather than a separate file. Minor concern. |

**No unnecessary new components identified.** The DuplicateDetector as a separate file is a minor organizational preference, not over-engineering.

### Duplicated Logic
- Parser validation (Zod) is used in both the upload flow (server-side) and the confirm flow. This is intentional double-validation (defense in depth), not duplication.
- Identity resolution is centralized in a single service class. No duplication.
- No logic is reimplemented that already exists in Feature 1.

**PASS** -- No duplicated logic.

### Missing Reuse Opportunities
- The existing `src/lib/supabase.ts` client is correctly referenced for all DB operations.
- All Feature 1 Zod schemas are referenced by exact path and used in validation.
- The existing `AgeGroup` enum is reused for both UI selectors and parameter validation.
- The existing `Database` types are referenced for type-safe queries.

**One minor note:** The `csv-parse` library is mentioned in requirements.md as an existing tech stack item, but since CSV parsing is deferred, its absence from the spec and tasks is correct.

**PASS** -- No missing reuse opportunities.

### Over-Engineering Concerns
- The spec does NOT introduce unnecessary abstractions (e.g., no plugin system for parsers, no event bus, no state management library beyond Svelte 5 runes).
- The `FileParserInterface<T>` generic interface is lightweight and justified -- it ensures the deferred CSV parser will conform to the same contract.
- The two-endpoint architecture (upload + confirm) is appropriate for the multi-step flow (parse -> preview -> resolve -> confirm). A single endpoint would require passing all state back and forth or maintaining server-side session state.
- The Supabase RPC for atomic replace is a targeted solution to a real constraint (JS client lacks multi-table transactions), not over-engineering.

**PASS** -- No over-engineering concerns.

**Check 7 Result: PASS** -- No unnecessary components, no duplicated logic, no missing reuse opportunities, no over-engineering.

---

## Critical Issues

**None identified.**

All 7 checks passed. The requirements, specification, and task list are internally consistent and accurately reflect the user's answers.

---

## Minor Issues

1. **DuplicateDetector as separate file (Task 2.4):** The duplicate detection logic could arguably live as methods within `ImportService` rather than a separate `duplicate-detector.ts` file. This is a minor organizational preference and does not affect correctness or scope. The separation does improve testability, so this is acceptable as-is.

2. **Performance requirement (NF1) not explicitly tasked:** The 3-second performance target for parsing is not explicitly called out in any task's acceptance criteria. It is implicitly covered by the parser implementation and the E2E test, but an explicit performance assertion in the Finishes parser test (Task 1.7) would strengthen coverage. This is a minor gap since the reference file (76 rows x 189 cols) is small enough that performance is unlikely to be an issue.

3. **Colley import `ranking_run` creation:** The spec (F4, F9) and Task 2.6 both mention creating a `ranking_run` record for each Colley import. However, the spec references a `ranking_runs` table (plural) while the migration file is `create_ranking_runs_table.sql` and the schema references `ranking_run_id`. This naming is consistent within the codebase but the spec's "Colley import writes to `ranking_results` table" phrasing could be clearer about the `ranking_run` parent record creation step being part of the confirm flow rather than the parsing flow.

4. **Empty visuals directory:** The `planning/visuals/` directory exists but is empty. While not incorrect (requirements.md notes "No visual assets provided"), the spec includes an ASCII wireframe that could have been rendered as a visual asset. This is a cosmetic point and does not affect functionality.

5. **Supabase client is browser-side only:** The existing `src/lib/supabase.ts` uses `import.meta.env.PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, which are public/client-side credentials. For server-side API endpoints (Tasks 2.5, 2.6), the tasks should use a server-side Supabase client with the service role key for elevated permissions (e.g., RPC calls, bulk deletes). This is not explicitly addressed in the tasks but may be handled implicitly by SvelteKit's server-side environment variable access. Worth noting during implementation.

---

## Over-Engineering Concerns

**None.** The architecture is appropriately scoped for the feature:
- No unnecessary abstraction layers or frameworks
- Parser interface is minimal (one generic interface, not a plugin system)
- State management uses native Svelte 5 runes, not an external state library
- Two-endpoint architecture (upload/confirm) is the natural fit for the multi-step flow
- Supabase RPC is a targeted solution for a specific atomicity constraint

---

## Recommendations

1. **Add a performance assertion to Finishes parser tests:** In Task 1.7, consider adding a test (or a note in acceptance criteria) that verifies parsing the fixture completes within a reasonable time bound (e.g., < 1 second for the small fixture). This provides a regression safety net for NF1.

2. **Clarify server-side Supabase client usage:** During implementation of Tasks 2.5, 2.6, and 2.7, ensure a server-side Supabase client is used (with appropriate service role key) rather than the existing public client from `$lib/supabase.ts`. This should be documented in the task or handled as an implementation detail.

3. **Consider consolidating DuplicateDetector into ImportService:** If the team prefers fewer files, the duplicate detection methods could be methods on `ImportService`. However, the current separation is also valid for testability and is not a blocking concern.

---

## Conclusion

**Verification Status: PASS**

The specification and task list for Feature 2 (Data Ingestion Pipeline) are well-constructed and ready for implementation. All 7 verification checks passed:

- All 8 user Q&A answers are accurately captured in requirements.md
- Visual assets are correctly noted as absent
- Requirements are comprehensive with clear scope boundaries
- The spec fully covers all functional and non-functional requirements
- The task list has full traceability to spec requirements with appropriate test counts
- Reusability of Feature 1 assets is thoroughly documented and leveraged
- No over-engineering or unnecessary new components were identified

The 5 minor issues noted are informational and do not require changes before implementation begins. The 2 recommendations are quality improvements that can be addressed during implementation.

**Total sub-tasks:** 29
**Total tests:** 18 (embedded) + up to 10 (gap-filling) = up to 28
**Task groups:** 4 (with clear dependency chain)
**Reused Feature 1 assets:** 7 (Zod schemas, Supabase client, Database types, AgeGroup enum)
