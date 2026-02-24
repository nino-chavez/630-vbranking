# Testing Strategy

**Last updated:** 2026-02-24

This document describes the testing philosophy, structure, patterns, and tooling for the Volleyball Ranking Engine project.

## Testing Philosophy

The test suite is built on three principles:

1. **Pure function testing first.** The ranking algorithms (Colley Matrix, Elo variants), normalization, win/loss derivation, and export formatting are all pure functions. Tests call them directly with hand-crafted inputs and verify outputs against mathematically computed expected values. No mocks, no I/O.

2. **Mock the boundary, not the logic.** Service-layer tests (RankingService, ImportService, IdentityResolver) construct mock Supabase clients that replicate the PostgREST query-builder chain (`from().select().eq().order()`). The mock returns configured data; the service logic under test is real.

3. **jsdom for component rendering.** Svelte 5 components are rendered with `@testing-library/svelte` in a jsdom environment. Tests verify DOM output, ARIA attributes, accessible names, and CSS class application. No browser is required.

## Test Pyramid

```
          /  2 files, 10 tests  \        Integration (SQL migration analysis)
         /  2 files, 14 tests    \       Service (mock Supabase)
        / 10 files, 49 tests      \      Component (jsdom + Testing Library)
       /  22 files, 117 tests      \     Unit (pure functions)
      ----------------------------------
```

| Layer                     |  Files |   Tests | Scope                                                                                                                                                          |
| ------------------------- | -----: | ------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit (ranking algorithms) |     16 |      60 | Colley, Elo, normalization, aggregation, derive-wins-losses, table-utils, seeding-factors, precision, determinism, weighting, multi-age-group, backward-compat |
| Unit (import parsers)     |      3 |      11 | FinishesParser, ColleyParser, error handling                                                                                                                   |
| Unit (export)             |      3 |      27 | CSV generation, XLSX generation, export-data assembly                                                                                                          |
| Unit (schemas)            |      1 |      13 | Zod schema validation for ranking overrides                                                                                                                    |
| Unit (UI logic)           |      1 |      12 | FileDropZone validation, identity resolution, data preview, state machine                                                                                      |
| Component (Svelte)        |      8 |      37 | Design system components, accessibility, override panel, ranking table, design tokens, contrast                                                                |
| Service                   |      2 |      14 | RankingService (mock Supabase), ImportService + IdentityResolver (mock Supabase)                                                                               |
| Integration               |      2 |      10 | SQL migration structural analysis (FK constraints, UNIQUE constraints)                                                                                         |
| **Total**                 | **36** | **180** |                                                                                                                                                                |

The 36 files producing 180 tests run via `npx vitest run` in approximately 2.3 seconds. The 2 integration test files under `tests/integration/` contain 10 additional tests that verify migration SQL structure; these run separately because the vitest config scopes to `src/**/*.test.ts`.

## Tools and Frameworks

| Tool                    | Version               | Purpose                                                          |
| ----------------------- | --------------------- | ---------------------------------------------------------------- |
| Vitest                  | 4.0.18                | Test runner, assertion library, mocking (`vi.fn()`, `vi.mock()`) |
| jsdom                   | (bundled with Vitest) | DOM environment for component tests                              |
| @testing-library/svelte | latest                | `render()`, `screen`, `cleanup()` for Svelte 5 component tests   |
| xlsx                    | (project dependency)  | Used in parser tests to build in-memory XLSX fixtures            |
| Node.js `fs`            | built-in              | Used in integration tests to read SQL migration files            |

## Directory Structure

```
src/
  lib/
    ranking/
      __tests__/
        colley.test.ts              # 4 tests - Colley Matrix ratings
        elo.test.ts                 # 4 tests - Elo rating computation
        normalize.test.ts           # 4 tests - Normalization and aggregation
        derive-wins-losses.test.ts  # 4 tests - Finish-to-pairwise conversion
        integration.test.ts         # 2 tests - Cross-algorithm end-to-end
        edge-cases.test.ts          # 3 tests - Zero games, large dataset, all ties
        determinism.test.ts         # 2 tests - Repeatability and input-order independence
        precision.test.ts           # 2 tests - Numerical invariants
        colley-weighted.test.ts     # 4 tests - Weighted Colley Matrix
        elo-weighted.test.ts        # 4 tests - Weighted Elo
        weighting-edge-cases.test.ts # 3 tests - Extreme weights, mixed weights
        backward-compatibility.test.ts # 2 tests - Weight=1.0 equals unweighted
        multi-age-group.test.ts     # 5 tests - Age group independence
        seeding-factors.test.ts     # 5 tests - Win percentage, national finishes
        table-utils.test.ts         # 6 tests - Sort and filter utilities
        table-utils-overrides.test.ts # 7 tests - Override-aware ranking
        ranking-service.test.ts     # 7 tests - Service orchestration (mock Supabase)
    import/
      __tests__/
        import-service.test.ts      # 7 tests - Identity resolution, merge, duplicates
        validation-integration.test.ts # 3 tests - Zod schema integration
        import-mode-edge-cases.test.ts # 2 tests - Merge idempotency, replace errors
      parsers/
        __tests__/
          finishes-parser.test.ts   # 5 tests - XLSX finishes parsing
          colley-parser.test.ts     # 3 tests - XLSX Colley data parsing
          error-handling.test.ts    # 3 tests - Malformed file handling
    export/
      __tests__/
        csv.test.ts                 # 7 tests - CSV generation
        xlsx.test.ts                # 5 tests - XLSX workbook generation
        export-data.test.ts         # 15 tests - Row assembly, headers, metadata
    schemas/
      __tests__/
        ranking-override.test.ts    # 13 tests - Override schema validation
    components/
      __tests__/
        design-system-components.test.ts # 8 tests - Button, Banner, Card, NavHeader, etc.
        accessibility.test.ts       # 4 tests - ARIA roles, labels, focus
        override-panel.test.ts      # 8 tests - Override slide panel
        page-retrofit.test.ts       # 5 tests - Tier colors, rank badges, semantic markup
        ranking-ui.test.ts          # 3 tests - RankingResultsTable rendering
        component-edge-cases.test.ts # 4 tests - Freshness, tier boundaries, loading
        import-ui.test.ts           # 12 tests - FileDropZone, identity resolution, preview
        design-tokens.test.ts       # 3 tests - CSS custom property definitions
        contrast.test.ts            # 2 tests - WCAG AA contrast ratios
tests/
  integration/
    referential-integrity.test.ts   # 5 tests - FK constraint verification
    constraints-edge-cases.test.ts  # 5 tests - UNIQUE constraint + Zod edge cases
```

## Running Tests

Run the full suite (180 tests, 36 files):

```bash
npx vitest run
```

Run a single test file:

```bash
npx vitest run src/lib/ranking/__tests__/colley.test.ts
```

Run tests in watch mode during development:

```bash
npx vitest
```

Run tests matching a name pattern:

```bash
npx vitest run -t "produces correct ratings"
```

Run the integration tests (SQL migration analysis):

```bash
npx vitest run --config /dev/null tests/integration/
```

## Test Patterns

### Pattern 1: Pure Algorithm Testing with Hand-Computed Expected Values

Tests for ranking algorithms supply known inputs and compare outputs against values computed by hand. This approach catches regressions at the mathematical level.

```typescript
// From src/lib/ranking/__tests__/colley.test.ts
it('produces correct ratings for 3-team known example (A>B, A>C, B>C)', () => {
	const teams: TeamInfo[] = [
		{ id: 'team-a', name: 'Alpha', code: 'ALP' },
		{ id: 'team-b', name: 'Bravo', code: 'BRV' },
		{ id: 'team-c', name: 'Charlie', code: 'CHL' },
	];

	const records: PairwiseRecord[] = [
		{ team_a_id: 'team-a', team_b_id: 'team-b', winner_id: 'team-a', tournament_id: 't1' },
		{ team_a_id: 'team-a', team_b_id: 'team-c', winner_id: 'team-a', tournament_id: 't1' },
		{ team_a_id: 'team-b', team_b_id: 'team-c', winner_id: 'team-b', tournament_id: 't1' },
	];

	const results = computeColleyRatings(records, teams);

	expect(teamA.rating).toBeCloseTo(0.7, 4);
	expect(teamB.rating).toBeCloseTo(0.5, 4);
	expect(teamC.rating).toBeCloseTo(0.3, 4);
});
```

### Pattern 2: Mock Supabase Client for Service Tests

Service tests construct a mock Supabase client that mirrors the PostgREST chain. Each table returns configured data via overrides. The mock tracks insert/update/delete calls for assertion.

```typescript
// From src/lib/ranking/__tests__/ranking-service.test.ts
function createMockSupabase(overrides: {
	seasons?: { data: unknown; error: unknown };
	teams?: { data: unknown; error: unknown };
	// ...more tables
}) {
	const client = {
		from: vi.fn((table: string) => {
			if (table === 'seasons') {
				return {
					select: () => ({
						eq: () => ({
							single: () =>
								Promise.resolve(overrides.seasons ?? { data: { id: 'season-1' }, error: null }),
						}),
					}),
				};
			}
			// ...additional tables
		}),
	};
	return client as any;
}

it('orchestrates a full ranking run with 3 teams', async () => {
	const supabase = createMockSupabase({});
	const service = new RankingService(supabase);
	const output = await service.runRanking(defaultConfig);

	expect(output.ranking_run_id).toBe('run-123');
	expect(output.teams_ranked).toBe(3);
});
```

### Pattern 3: In-Memory XLSX Fixture Construction

Parser tests build XLSX buffers programmatically using the `xlsx` library, then feed them to the parser. This avoids test fixtures on disk and makes the test self-documenting.

```typescript
// From src/lib/import/parsers/__tests__/finishes-parser.test.ts
function buildFinishesFixture(): ArrayBuffer {
  const row1: (string | null)[] = [];
  row1[10] = 'AZ Region #1';
  row2[10] = 'Div'; row2[11] = 'Fin'; row2[12] = 'Tot';

  const dataRows = [
    ['Alpha', 'ALP', ...null, '18O', 3, 24, ...],
    ['Bravo', 'BRV', ...null, '18O', 1, 24, ...],
  ];

  const ws = XLSX.utils.aoa_to_sheet([row1, row2, ...dataRows]);
  ws['!merges'] = [{ s: { r: 0, c: 10 }, e: { r: 0, c: 12 } }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Finishes');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
}
```

### Pattern 4: Component Testing with @testing-library/svelte

Component tests use the jsdom environment directive, render Svelte 5 components with `render()`, and query the DOM using accessible selectors (`getByRole`, `getByLabelText`, `getByText`).

```typescript
// From src/lib/components/__tests__/override-panel.test.ts
// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/svelte';
import OverridePanel from '../OverridePanel.svelte';

afterEach(() => cleanup());

it('renders team name and original rank when open', () => {
	render(OverridePanel, { props: baseProps });
	expect(screen.getByText('Alpha Wolves')).toBeTruthy();
	expect(screen.getByText(/Algorithmic Rank:/)).toBeTruthy();
});

it('calls onclose when Cancel button is clicked', async () => {
	const onclose = vi.fn();
	render(OverridePanel, { props: { ...baseProps, onclose } });
	screen.getByRole('button', { name: /Cancel/i }).click();
	expect(onclose).toHaveBeenCalledOnce();
});
```

### Pattern 5: SQL Migration Structural Analysis

Integration tests read SQL migration files from disk and verify foreign key constraints, UNIQUE constraints, and CASCADE/RESTRICT policies using regex matching. No running database is required.

```typescript
// From tests/integration/referential-integrity.test.ts
it('tournaments migration contains REFERENCES seasons(id) ON DELETE CASCADE', () => {
	const sql = readMigration('20260223180006_create_tournaments_table.sql');

	expect(sql).toMatch(
		/season_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+seasons\s*\(\s*id\s*\)\s+ON\s+DELETE\s+CASCADE/i,
	);
});
```

### Pattern 6: Determinism and Performance Assertions

Tests verify that the ranking pipeline produces identical results on repeated runs and with shuffled input order. A performance test runs 73 teams across 60 tournaments and asserts completion under 5 seconds.

```typescript
// From src/lib/ranking/__tests__/determinism.test.ts
it('produces byte-identical results when run twice with same input', () => {
	const run1 = runFullPipeline(teams);
	const run2 = runFullPipeline(teams);
	expect(run1).toEqual(run2);
});

// From src/lib/ranking/__tests__/edge-cases.test.ts
it('large dataset: 73 teams, 60 tournaments completes under 5 seconds', () => {
	// ...generate 73 teams, 60 tournaments
	const start = performance.now();
	// ...run full pipeline
	const elapsed = performance.now() - start;
	expect(elapsed).toBeLessThan(5000);
});
```

### Pattern 7: WCAG AA Contrast Verification

Design system tests compute WCAG 2.1 relative luminance and contrast ratios between color pairs to verify AA compliance (4.5:1 minimum for normal text).

```typescript
// From src/lib/components/__tests__/contrast.test.ts
it('all primary text/background pairings meet 4.5:1 for normal text', () => {
	const pairings = [
		{ fg: '#111827', bg: '#FAFAFA', label: 'text-primary on bg', minRatio: 4.5 },
		{ fg: '#2563EB', bg: '#FFFFFF', label: 'accent on surface', minRatio: 4.5 },
		// ...
	];
	for (const { fg, bg, label, minRatio } of pairings) {
		const ratio = contrastRatio(fg, bg);
		expect(ratio).toBeGreaterThanOrEqual(minRatio);
	}
});
```

## Mocking Strategy

### Supabase Client Mocks

The project does not use a shared mock module. Each service test file defines its own `createMockSupabase()` factory tailored to the tables and query chains that specific service touches. This keeps mocks minimal and co-located with the tests that use them.

Two distinct mock patterns exist:

1. **Table-router pattern** (`ranking-service.test.ts`): The `from()` mock switches on the table name and returns a chain shaped for each table's specific query pattern (select/insert/update/delete).

2. **Generic chain pattern** (`import-service.test.ts`): The `from()` mock returns a single chainable object with configurable terminal methods (`maybeSingle`, `insert`, `update`). A call counter tracks which response to return for sequential lookups.

### No Global Mocks

The vitest config has an empty `setupFiles` array. There are no global mocks, no module-level `vi.mock()` calls, and no shared test utilities. Each test file is self-contained.

## Quality Gates

| Gate                  | Threshold                           | Enforcement                          |
| --------------------- | ----------------------------------- | ------------------------------------ |
| All tests pass        | 180/180 (0 failures)                | `npx vitest run` exit code           |
| Type checking         | Zero errors                         | `npm run check` (svelte-check + tsc) |
| Test execution time   | Under 5 seconds total               | Vitest reports ~2.3s                 |
| Performance budget    | 73 teams / 60 tournaments under 5s  | Asserted in `edge-cases.test.ts`     |
| WCAG AA contrast      | 4.5:1 minimum                       | Asserted in `contrast.test.ts`       |
| Design tokens present | 14 color + 7 spacing + 8 typography | Asserted in `design-tokens.test.ts`  |

## Conventions

- Test files live in `__tests__/` directories adjacent to the source code they test.
- Test file names match the source module: `colley.ts` is tested by `colley.test.ts`.
- The `// @vitest-environment jsdom` directive is used only in component test files; all other tests run in the default Node.js environment.
- `afterEach(() => cleanup())` is called in every component test to prevent DOM leakage between tests.
- `toBeCloseTo()` is used for floating-point comparisons throughout the algorithm tests (precision 2-4 decimal places).
- Svelte 5 snippets are created via `createRawSnippet()` for injecting children content in component tests.
