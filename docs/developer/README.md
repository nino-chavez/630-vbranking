# Developer Guide

> Last updated: 2026-02-24

This guide covers everything you need to contribute to the Volleyball Ranking Engine -- from local setup through common development tasks.

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd volleyball-ranking-engine

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your Supabase project credentials (see Environment Setup below)

# 4. Start the dev server
npm run dev

# 5. Run the test suite
npx vitest run
```

The dev server starts at `http://localhost:5173` by default.

## Prerequisites

| Requirement | Version                            | Notes                          |
| ----------- | ---------------------------------- | ------------------------------ |
| Node.js     | 18+ (LTS recommended)              | Runtime for SvelteKit and Vite |
| npm         | 9+                                 | Bundled with Node.js           |
| Supabase    | Hosted project **or** Supabase CLI | PostgreSQL database backend    |

### Optional

| Tool         | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| Supabase CLI | Local development with `supabase start`, schema migrations |
| Git          | Version control                                            |

## Environment Setup

The application requires two environment variables to connect to Supabase. Server-side API endpoints additionally require a service role key.

### Required Variables

| Variable                                  | Description                                                 | Used In                                       |
| ----------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| `PUBLIC_SUPABASE_URL`                     | Supabase project URL (e.g. `https://<project>.supabase.co`) | Client + Server                               |
| `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key                               | Client only                                   |
| `SUPABASE_SERVICE_ROLE_KEY`               | Supabase service role key (elevated permissions)            | Server only (`+server.ts`, `+page.server.ts`) |

### Create Your `.env` File

Create a `.env` file in the project root:

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these values in your Supabase dashboard under **Settings > API**.

> The `.env` file is gitignored. Never commit credentials to version control.

### Local Supabase (Optional)

If you prefer a local database instead of the hosted service:

```bash
# Start local Supabase containers
supabase start

# Apply migrations
supabase db push

# Use the local credentials printed by `supabase start`
```

The local project is configured in `supabase/config.toml` with project ID `volleyball-ranking-engine`, API port `54321`, and database port `54322`.

## Development Workflow

### Commands

| Command                     | Description                                     |
| --------------------------- | ----------------------------------------------- |
| `npm run dev`               | Start Vite dev server with HMR                  |
| `npm run build`             | Production build                                |
| `npm run preview`           | Preview the production build locally            |
| `npm run check`             | Run `svelte-check` and TypeScript type checking |
| `npm run check:watch`       | Type checking in watch mode                     |
| `npx vitest run`            | Run all tests (180 tests across 36 files)       |
| `npx vitest`                | Run tests in watch mode                         |
| `npx vitest run --coverage` | Run tests with coverage report                  |

### Type Checking

The project uses TypeScript 5.9 in strict mode. Run type checking before committing:

```bash
npm run check
```

This runs `svelte-kit sync` (to regenerate `$types` modules) followed by `svelte-check`.

### Testing

Tests use **Vitest 4.0** with **jsdom** environment and **Testing Library (Svelte)**. Tests live alongside source code in `__tests__/` directories:

```
src/lib/ranking/__tests__/colley.test.ts      # Algorithm unit tests
src/lib/components/__tests__/design-system-components.test.ts  # Component tests
tests/integration/referential-integrity.test.ts  # Schema structural tests
```

Run a specific test file:

```bash
npx vitest run src/lib/ranking/__tests__/colley.test.ts
```

Run tests matching a pattern:

```bash
npx vitest run --reporter=verbose -t "computeColleyRatings"
```

### Building

```bash
npm run build
```

The project uses `@sveltejs/adapter-auto`, which selects the appropriate adapter for the deployment target. The Vite config integrates Tailwind CSS 4.2 via the `@tailwindcss/vite` plugin (no PostCSS configuration needed).

## Project Structure

```
volleyball-ranking-engine/
├── src/
│   ├── app.css                        # Global styles (Tailwind directives)
│   ├── app.d.ts                       # SvelteKit app type declarations
│   ├── lib/
│   │   ├── assets/                    # Static assets (favicon)
│   │   ├── components/                # Reusable Svelte 5 UI components
│   │   │   ├── __tests__/             # Component unit tests
│   │   │   ├── Banner.svelte          # Alert/info banners
│   │   │   ├── Button.svelte          # Button with variants, loading state
│   │   │   ├── Card.svelte            # Content card with optional header
│   │   │   ├── DataPreviewTable.svelte # Import preview table
│   │   │   ├── DataTable.svelte       # Generic data table
│   │   │   ├── ExportDropdown.svelte  # CSV/XLSX/PDF export trigger
│   │   │   ├── FileDropZone.svelte    # Drag-and-drop file upload
│   │   │   ├── FreshnessIndicator.svelte # Relative timestamp display
│   │   │   ├── IdentityResolutionPanel.svelte # Team name matching UI
│   │   │   ├── ImportSummary.svelte   # Post-import summary
│   │   │   ├── NavHeader.svelte       # Top navigation bar
│   │   │   ├── OverridePanel.svelte   # Committee rank override form
│   │   │   ├── PageHeader.svelte      # Page title + subtitle
│   │   │   ├── PageShell.svelte       # Layout wrapper
│   │   │   ├── RankBadge.svelte       # Styled rank number
│   │   │   ├── RankingResultsTable.svelte # Rankings display table
│   │   │   ├── Select.svelte          # Labeled select dropdown
│   │   │   ├── Spinner.svelte         # Loading indicator
│   │   │   └── TierRow.svelte         # Tournament tier display row
│   │   ├── export/                    # Export module (CSV, XLSX, PDF)
│   │   │   ├── __tests__/             # Export unit tests
│   │   │   ├── csv.ts                 # RFC 4180 CSV generator
│   │   │   ├── download.ts            # Browser download trigger
│   │   │   ├── export-data.ts         # Shared export data assembly
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── pdf.ts                # jsPDF-based PDF generator
│   │   │   ├── types.ts              # Export type definitions
│   │   │   └── xlsx.ts               # XLSX workbook generator
│   │   ├── import/                    # Data ingestion pipeline
│   │   │   ├── __tests__/             # Import unit tests
│   │   │   ├── __fixtures__/          # Test fixture generators
│   │   │   ├── duplicate-detector.ts  # Duplicate detection logic
│   │   │   ├── identity-resolver.ts   # Team name identity resolution
│   │   │   ├── import-service.ts      # Import orchestration service
│   │   │   ├── parsers/               # XLSX file parsers
│   │   │   │   ├── colley-parser.ts   # Colley rating import parser
│   │   │   │   ├── finishes-parser.ts # Tournament finishes parser
│   │   │   │   ├── match-parser.ts    # Match record parser
│   │   │   │   └── index.ts          # Parser barrel export
│   │   │   └── types.ts              # Import type definitions
│   │   ├── ranking/                   # Core ranking algorithm engine
│   │   │   ├── __tests__/             # Algorithm unit tests (17 files)
│   │   │   ├── colley.ts             # Colley Matrix (LU decomposition)
│   │   │   ├── derive-wins-losses.ts  # W/L derivation from finishes/matches
│   │   │   ├── elo.ts                # Parameterized Elo algorithm
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── normalize.ts          # Min-max normalization + aggregation
│   │   │   ├── ranking-service.ts     # Pipeline orchestration (DB access)
│   │   │   ├── seeding-factors.ts     # Win %, best national finish
│   │   │   ├── table-utils.ts        # UI table helper functions
│   │   │   └── types.ts              # Ranking type definitions
│   │   ├── schemas/                   # Zod validation schemas
│   │   │   ├── __tests__/             # Schema validation tests
│   │   │   ├── enums.ts              # AgeGroup, RankingScope enums
│   │   │   ├── index.ts              # Barrel export
│   │   │   ├── match.ts              # Match schema
│   │   │   ├── ranking-override.ts    # Override schema
│   │   │   ├── ranking-result.ts      # Ranking result schema
│   │   │   ├── ranking-run.ts        # Ranking run schema
│   │   │   ├── season.ts             # Season schema
│   │   │   ├── team.ts               # Team schema
│   │   │   ├── tournament-result.ts   # Tournament result schema
│   │   │   ├── tournament-weight.ts   # Tournament weight schema
│   │   │   └── tournament.ts         # Tournament schema
│   │   ├── types/
│   │   │   └── database.types.ts      # Auto-generated Supabase types
│   │   ├── utils/
│   │   │   └── format.ts             # Date/number formatting utilities
│   │   ├── supabase.ts               # Client-side Supabase client
│   │   ├── supabase-server.ts        # Server-side Supabase client (service role)
│   │   └── index.ts                  # Root lib barrel export
│   └── routes/
│       ├── +layout.svelte             # Root layout (NavHeader + PageShell)
│       ├── +page.svelte               # Home page
│       ├── api/
│       │   ├── import/
│       │   │   ├── upload/+server.ts  # POST: Parse XLSX, return preview
│       │   │   └── confirm/+server.ts # POST: Commit parsed data to DB
│       │   └── ranking/
│       │       ├── run/+server.ts     # POST: Execute ranking computation
│       │       ├── runs/+server.ts    # GET: List ranking runs
│       │       ├── runs/finalize/+server.ts # POST: Lock a run
│       │       ├── results/+server.ts # GET: Fetch results for a run
│       │       ├── weights/+server.ts # GET/PUT: Tournament weights
│       │       ├── overrides/+server.ts # GET/POST/DELETE: Overrides
│       │       └── team/[id]/
│       │           ├── +server.ts     # GET: Team detail + breakdown
│       │           ├── h2h/+server.ts # GET: Head-to-head records
│       │           └── history/+server.ts # GET: Ranking history
│       ├── import/
│       │   ├── +page.server.ts        # Server load function
│       │   └── +page.svelte           # Import page (file upload UI)
│       └── ranking/
│           ├── +page.server.ts        # Server load function (seasons)
│           ├── +page.svelte           # Rankings dashboard page
│           ├── weights/
│           │   ├── +page.server.ts    # Server load for weights
│           │   └── +page.svelte       # Tournament weights editor
│           └── team/[id]/
│               ├── +page.server.ts    # Server load for team detail
│               └── +page.svelte       # Team detail page
├── tests/
│   ├── integration/                    # Integration tests (SQL structural)
│   ├── migrations/                    # Migration-related tests
│   └── schemas/                       # Additional schema tests
├── supabase/
│   ├── config.toml                    # Supabase CLI configuration
│   └── migrations/                    # 15 sequential PostgreSQL migrations
├── data/
│   └── reference/                     # Sample data files for development
├── docs/                              # Project documentation
├── specchain/                         # Specification chain artifacts
├── package.json                       # Dependencies and scripts
├── svelte.config.js                   # SvelteKit adapter configuration
├── vite.config.ts                     # Vite + Tailwind + Vitest config
├── tsconfig.json                      # TypeScript strict configuration
└── CLAUDE.md                          # Project manifest
```

## Architecture Overview

The application is a **SvelteKit monolith** backed by **Supabase (hosted PostgreSQL)**. It uses a five-algorithm ensemble ranking approach:

1. **Colley Matrix** -- Time-independent algorithm solving `Cr=b` via LU decomposition (`ml-matrix`)
2. **Elo (2200)** -- Chronological Elo with starting rating 2200
3. **Elo (2400)** -- Chronological Elo with starting rating 2400
4. **Elo (2500)** -- Chronological Elo with starting rating 2500
5. **Elo (2700)** -- Chronological Elo with starting rating 2700

Each algorithm produces per-team ratings. These are min-max normalized to a 0-100 scale, averaged into an **AggRating**, and sorted to produce the **AggRank**.

### Key Architectural Patterns

- **Pure algorithm functions**: `colley.ts` and `elo.ts` have no database access. They accept typed inputs and return typed outputs. This makes them independently testable.
- **Service orchestration**: `RankingService` coordinates database reads, algorithm calls, normalization, and result persistence.
- **Zod schemas**: Every database entity has a corresponding Zod schema with `.omit()` variants for insert/update operations.
- **Server-side data loading**: SvelteKit `+page.server.ts` files fetch data before page render. API routes in `+server.ts` handle client-initiated operations.

## Common Tasks

### Add a New Ranking Algorithm

1. Create the algorithm function in `src/lib/ranking/`:

```typescript
// src/lib/ranking/my-algorithm.ts

import type { AlgorithmResult, TeamInfo } from './types.js';

export function computeMyRatings(
	/* typed inputs */
	teams: TeamInfo[],
): AlgorithmResult[] {
	// Implement algorithm -- pure function, no database access
	// Return sorted results with rank assigned
}
```

2. Add tests in `src/lib/ranking/__tests__/my-algorithm.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeMyRatings } from '../my-algorithm.js';

describe('computeMyRatings', () => {
	it('produces correct ratings for known input', () => {
		// Test with known hand-computed values
	});

	it('handles edge cases (0 teams, 1 team, ties)', () => {
		// Test edge cases
	});
});
```

3. Wire it into the pipeline in `src/lib/ranking/ranking-service.ts` by updating the `executeAlgorithms` method.

4. Export from the barrel file `src/lib/ranking/index.ts`.

### Add a New API Endpoint

1. Create the route file following SvelteKit conventions:

```typescript
// src/routes/api/my-resource/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { supabaseServer } from '$lib/supabase-server.js';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Parse query parameters
		// Query Supabase using the server client
		// Return JSON response
		return json({
			success: true,
			data: {
				/* ... */
			},
		});
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unexpected error';
		return json({ success: false, error: message }, { status: 500 });
	}
};
```

2. Use `supabaseServer` (from `$lib/supabase-server.js`) for database access in server routes. This client has elevated permissions via the service role key.

3. Validate inputs with Zod schemas from `$lib/schemas/`.

### Add a New UI Component

1. Create the component using Svelte 5 runes syntax:

```svelte
<!-- src/lib/components/MyComponent.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		variant?: 'default' | 'accent';
		children: Snippet;
	}

	let { title, variant = 'default', children }: Props = $props();

	const variantClasses: Record<string, string> = {
		default: 'bg-surface text-text-primary',
		accent: 'bg-accent text-white',
	};
</script>

<div class={variantClasses[variant]}>
	<h3>{title}</h3>
	{@render children()}
</div>
```

2. Write tests using Testing Library:

```typescript
// src/lib/components/__tests__/my-component.test.ts

// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import MyComponent from '../MyComponent.svelte';

afterEach(() => cleanup());

function textSnippet(text: string) {
	return createRawSnippet(() => ({
		render: () => `<span>${text}</span>`,
	}));
}

describe('MyComponent', () => {
	it('renders title and children', () => {
		render(MyComponent, {
			props: { title: 'Hello', children: textSnippet('Content') },
		});
		expect(screen.getByText('Hello')).toBeTruthy();
		expect(screen.getByText('Content')).toBeTruthy();
	});
});
```

3. Use Tailwind CSS 4.2 utility classes for styling. The design system uses semantic color tokens (`text-primary`, `bg-surface`, `bg-accent`, `border`, etc.).

### Add a New Zod Schema

Follow the existing pattern in `src/lib/schemas/`:

```typescript
// src/lib/schemas/my-entity.ts

import { z } from 'zod';

const uuidSchema = z.uuid();
const datetimeSchema = z.iso.datetime();

export const myEntitySchema = z.object({
	id: uuidSchema,
	name: z.string().min(1),
	created_at: datetimeSchema,
	updated_at: datetimeSchema,
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

## Troubleshooting

### `Cannot find module '$env/static/public'`

Run `svelte-kit sync` to regenerate type declarations:

```bash
npx svelte-kit sync
```

Or run `npm run check`, which calls `svelte-kit sync` automatically.

### `VITE_SUPABASE_URL is not defined` or Supabase Connection Errors

Verify your `.env` file exists in the project root and contains valid Supabase credentials. Restart the dev server after changing environment variables.

Note: This project uses `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (not `VITE_SUPABASE_URL`). Check the variable names match what `src/lib/supabase.ts` and `src/lib/supabase-server.ts` expect.

### Tests Fail with `ReferenceError: document is not defined`

Ensure the test file includes the jsdom environment directive at the top:

```typescript
// @vitest-environment jsdom
```

This is required for any test that renders Svelte components. Algorithm and schema tests do not need this directive since they run in the default Node.js environment.

### `ml-matrix` Import Errors

If you see errors related to `ml-matrix` during testing, verify the `resolve.conditions` setting in `vite.config.ts` includes `'browser'`:

```typescript
resolve: {
  conditions: ['browser'],
},
```

### Build Errors with Tailwind CSS

Tailwind CSS 4.2 is configured via the Vite plugin (`@tailwindcss/vite`), not PostCSS. Do not add a `postcss.config.js` file. If styles are not applied, verify the `tailwindcss()` plugin is listed in `vite.config.ts`.

### Migration Errors with Supabase CLI

Ensure the local Supabase instance is running (`supabase start`) before applying migrations. Use `supabase db push` for hosted projects or `supabase db reset` to reapply all migrations locally.

### Port Already in Use

The Vite dev server defaults to port 5173. If this port is occupied, Vite automatically selects the next available port. The Supabase local API uses port 54321 and the database uses port 54322.
