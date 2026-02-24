# Contributing Guidelines

> Last updated: 2026-02-24

Standards and practices for contributing to the Volleyball Ranking Engine.

## Code Style

### TypeScript

- **Strict mode**: The `tsconfig.json` enables `"strict": true`. All code must pass strict type checking.
- **Module resolution**: Uses `"moduleResolution": "bundler"` with `"rewriteRelativeImportExtensions": true`. Import with `.js` extensions even for `.ts` files:

  ```typescript
  // Correct
  import { computeColleyRatings } from './colley.js';
  import type { TeamInfo } from './types.js';

  // Incorrect
  import { computeColleyRatings } from './colley';
  import { computeColleyRatings } from './colley.ts';
  ```

- **Type-only imports**: Use `import type` for types and interfaces that are erased at runtime:

  ```typescript
  import type { PairwiseRecord, AlgorithmResult, TeamInfo } from './types.js';
  ```

- **Explicit return types**: Include return types on exported functions.
- **No `any`**: Avoid `any`. Use `unknown` when the type is genuinely unknown, then narrow with type guards or Zod parsing.

### Svelte 5 Runes

All components use the Svelte 5 runes API. Do not use the legacy `$:`, `export let`, or Svelte stores syntax.

| Rune       | Purpose                 | Example                                                 |
| ---------- | ----------------------- | ------------------------------------------------------- |
| `$state`   | Declare reactive state  | `let count = $state(0);`                                |
| `$derived` | Compute derived values  | `let doubled = $derived(count * 2);`                    |
| `$props`   | Declare component props | `let { title, variant = 'default' }: Props = $props();` |

**Props pattern**: Define an `interface Props` and destructure with `$props()`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		variant?: 'primary' | 'secondary';
		disabled?: boolean;
		children: Snippet;
	}

	let { title, variant = 'primary', disabled = false, children }: Props = $props();
</script>
```

**Snippet rendering**: Use `{@render children()}` instead of `<slot />`:

```svelte
<div>
	{@render children()}
</div>
```

**Event handlers**: Use `onclick` prop pattern (not `on:click` directive):

```svelte
<button onclick={handleClick}>Click me</button>
```

### Tailwind CSS

- Use Tailwind CSS 4.2 utility classes for all styling.
- The project uses the Vite plugin (`@tailwindcss/vite`), not PostCSS.
- Use semantic color tokens defined in the design system: `text-primary`, `text-secondary`, `text-muted`, `bg-surface`, `bg-surface-alt`, `bg-accent`, `bg-accent-hover`, `border`, `error`, `warning`, `success`.
- Keep class strings readable. For multi-variant components, use a `Record<string, string>` mapping:

  ```typescript
  const variantClasses: Record<string, string> = {
  	primary: 'bg-accent text-white hover:bg-accent-hover',
  	secondary: 'bg-surface text-text-secondary border border-border',
  };
  ```

### Zod Schemas

Every database entity follows this three-schema pattern:

1. **Full schema** (`myEntitySchema`): All columns including `id`, `created_at`, `updated_at`.
2. **Insert schema** (`myEntityInsertSchema`): Omits auto-generated fields (`id`, `created_at`, `updated_at`).
3. **Update schema** (`myEntityUpdateSchema`): All insert fields made `.partial()`.

```typescript
import { z } from 'zod';

export const myEntitySchema = z.object({
	id: z.uuid(),
	name: z.string().min(1),
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
});

export const myEntityInsertSchema = myEntitySchema.omit({
	id: true,
	created_at: true,
	updated_at: true,
});

export const myEntityUpdateSchema = myEntityInsertSchema.partial();

export type MyEntity = z.infer<typeof myEntitySchema>;
export type MyEntityInsert = z.infer<typeof myEntityInsertSchema>;
export type MyEntityUpdate = z.infer<typeof myEntityUpdateSchema>;
```

### Algorithm Functions

Keep ranking algorithm implementations as **pure functions** with no database access:

- Accept typed inputs (`PairwiseRecord[]`, `TeamInfo[]`, etc.).
- Return typed outputs (`AlgorithmResult[]`).
- Sort results by rating descending, with alphabetical tie-breaking by team name.
- Handle edge cases: zero teams (return `[]`), single team (return default rating), identical ratings (alphabetical tie-break).
- Place database orchestration in `RankingService`, not in algorithm functions.

## File Organization

### Directory Conventions

| Pattern         | Convention                                               |
| --------------- | -------------------------------------------------------- |
| Algorithm code  | `src/lib/ranking/<algorithm>.ts`                         |
| Algorithm tests | `src/lib/ranking/__tests__/<algorithm>.test.ts`          |
| Components      | `src/lib/components/<ComponentName>.svelte` (PascalCase) |
| Component tests | `src/lib/components/__tests__/<test-name>.test.ts`       |
| Schemas         | `src/lib/schemas/<entity>.ts` (kebab-case)               |
| API routes      | `src/routes/api/<resource>/+server.ts`                   |
| Pages           | `src/routes/<page>/+page.svelte`                         |
| Server loaders  | `src/routes/<page>/+page.server.ts`                      |
| Barrel exports  | `index.ts` in each module directory                      |
| Test fixtures   | `__fixtures__/` directories adjacent to tests            |

### Naming Conventions

| Element           | Convention       | Example                                               |
| ----------------- | ---------------- | ----------------------------------------------------- |
| Files             | kebab-case       | `derive-wins-losses.ts`, `ranking-service.ts`         |
| Components        | PascalCase       | `RankBadge.svelte`, `DataPreviewTable.svelte`         |
| Types/Interfaces  | PascalCase       | `AlgorithmResult`, `TeamInfo`                         |
| Functions         | camelCase        | `computeColleyRatings`, `normalizeAndAggregate`       |
| Constants         | UPPER_SNAKE_CASE | `DEFAULT_K_FACTOR`, `ELO_STARTING_RATINGS`            |
| Database columns  | snake_case       | `team_id`, `agg_rating`, `ranking_run_id`             |
| CSS tokens        | kebab-case       | `text-primary`, `bg-accent-hover`                     |
| Test descriptions | Sentence case    | `'produces correct ratings for 3-team known example'` |

## Git Workflow

### Branch Naming

Use descriptive branch names with a category prefix:

```
feat/add-strength-of-schedule
fix/colley-matrix-singular-input
refactor/extract-normalization-utils
test/add-edge-case-coverage
docs/update-api-reference
```

### Commit Messages

Write clear, imperative commit messages:

```
Add seeding factor computation for Tier-1 tournaments

Compute win percentage and best national finish for each team.
Tier-1 tournaments are identified via the tournament_weights tier column.
Results are included in the ranking run API response.
```

- First line: imperative summary under 72 characters.
- Blank line, then optional body with context and rationale.
- Reference issue numbers when applicable: `Fixes #42`.

### Commit Scope

- Make focused commits that address a single concern.
- Separate structural refactors from behavior changes.
- Include related test changes in the same commit as the code they test.

## Testing Requirements

### Test Organization

Tests live in `__tests__/` directories adjacent to the code they test:

```
src/lib/ranking/colley.ts
src/lib/ranking/__tests__/colley.test.ts
```

Integration tests that span multiple modules or verify SQL structure live in `tests/`:

```
tests/integration/referential-integrity.test.ts
```

### Writing Tests

Use Vitest with the following patterns:

**Algorithm tests** (no DOM, default Node.js environment):

```typescript
import { describe, it, expect } from 'vitest';
import { computeColleyRatings } from '../colley.js';
import type { PairwiseRecord, TeamInfo } from '../types.js';

describe('computeColleyRatings', () => {
	it('produces correct ratings for 3-team known example', () => {
		const teams: TeamInfo[] = [
			{ id: 'team-a', name: 'Alpha', code: 'ALP' },
			{ id: 'team-b', name: 'Bravo', code: 'BRV' },
			{ id: 'team-c', name: 'Charlie', code: 'CHL' },
		];

		const records: PairwiseRecord[] = [
			{ team_a_id: 'team-a', team_b_id: 'team-b', winner_id: 'team-a', tournament_id: 't1' },
			// ...
		];

		const results = computeColleyRatings(records, teams);

		expect(results).toHaveLength(3);
		expect(results[0].rating).toBeCloseTo(0.7, 4);
		expect(results[0].rank).toBe(1);
	});

	it('returns empty array for zero teams', () => {
		expect(computeColleyRatings([], [])).toEqual([]);
	});
});
```

**Component tests** (jsdom environment required):

```typescript
// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from '../Button.svelte';

afterEach(() => cleanup());

function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
	}));
}

describe('Button', () => {
	it('renders with correct role', () => {
		render(Button, {
			props: { variant: 'primary', children: textSnippet('Click') },
		});
		expect(screen.getByRole('button', { name: /Click/i })).toBeTruthy();
	});
});
```

**Schema tests** (validation boundary testing):

```typescript
import { describe, it, expect } from 'vitest';
import { myEntitySchema, myEntityInsertSchema } from '../my-entity.js';

describe('myEntitySchema', () => {
	const valid = {
		/* all required fields */
	};

	it('accepts valid input', () => {
		expect(myEntitySchema.safeParse(valid).success).toBe(true);
	});

	it('rejects invalid field', () => {
		expect(myEntitySchema.safeParse({ ...valid, name: '' }).success).toBe(false);
	});
});
```

### Test Coverage

- Maintain existing test coverage when modifying code. Do not reduce coverage.
- Write tests for all new functions, components, and schemas.
- Cover edge cases: empty inputs, single-element inputs, boundary values, invalid inputs.
- For ranking algorithms, verify results against hand-computed expected values.
- For Zod schemas, test both valid and invalid inputs at each validation boundary.

### Running Tests

```bash
# Run all tests
npx vitest run

# Run in watch mode
npx vitest

# Run specific file
npx vitest run src/lib/ranking/__tests__/colley.test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Run with coverage
npx vitest run --coverage
```

All 180 tests across 36 files must pass before submitting a pull request.

## Pull Request Process

### Before Submitting

1. **Run the full test suite**: `npx vitest run`
2. **Run type checking**: `npm run check`
3. **Build successfully**: `npm run build`
4. **Self-review**: Read through your diff and verify:
   - No debug `console.log` statements left in production code.
   - No hardcoded credentials or secrets.
   - No `any` types without justification.
   - All new exports are added to barrel `index.ts` files.

### PR Description

Include:

- **Summary**: What the change does and why.
- **Testing**: How the change was tested (new tests, manual verification).
- **Screenshots**: For UI changes, include before/after screenshots.
- **Breaking changes**: Note any changes to API contracts or database schema.

### Review Checklist

Reviewers verify:

- [ ] Tests pass (`npx vitest run`)
- [ ] Type checking passes (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] New code follows the existing patterns (runes, schema conventions, pure algorithms)
- [ ] Edge cases are tested (empty input, single item, ties, invalid data)
- [ ] No secrets or credentials in the diff
- [ ] Database migrations are sequential and non-destructive

### Database Migration Changes

If your change includes new migrations:

1. Name the migration file with the next sequential timestamp following the existing pattern: `YYYYMMDDHHMMNN_description.sql`.
2. Migrations must be additive (create, add column) rather than destructive (drop table, remove column) whenever possible.
3. Test the migration against a fresh database: `supabase db reset`.
4. Update `CLAUDE.md` if the migration adds new tables, columns, or RPC functions.

## Documentation Standards

Follow the project's documentation conventions from `CLAUDE.md`:

- **Format**: GitHub-Flavored Markdown.
- **Diagrams**: Mermaid.js embedded in Markdown.
- **Location**: `docs/` directory.
- **File naming**: kebab-case.
- **Headers**: Title Case.
- **Voice**: Active voice, present tense, second person ("you") for instructions.
- **No emoji** unless explicitly requested.
- **Code blocks**: Always include language tags (``typescript`, ``sql`, ````svelte`, etc.).

## API Response Convention

All API endpoints return JSON with this structure:

**Success:**

```json
{
	"success": true,
	"data": {
		/* response payload */
	}
}
```

**Error:**

```json
{
	"success": false,
	"error": "Human-readable error message"
}
```

Use appropriate HTTP status codes: `200` for success, `400` for validation errors, `500` for server errors.

## Questions

If you are unsure about a convention or architectural decision, review:

- `CLAUDE.md` -- Project manifest with domain terminology, ADRs, and schema reference.
- Existing code in the same module for established patterns.
- The relevant `__tests__/` directory for expected behavior examples.
