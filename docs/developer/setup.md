# Environment Setup

> Last updated: 2026-02-24

Step-by-step instructions to set up a local development environment for the Volleyball Ranking Engine.

## Step 1: Install Node.js

Install Node.js 18 or later. The project uses TypeScript 5.9, SvelteKit 2.50, and Vite 7.3, which require a modern Node.js runtime.

**Option A -- Node Version Manager (recommended):**

```bash
# Install nvm (if not already installed)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Install and use Node.js LTS
nvm install --lts
nvm use --lts
```

**Option B -- Direct download:**

Download the LTS installer from [nodejs.org](https://nodejs.org/).

**Verify installation:**

```bash
node --version   # Should print v18.x or later
npm --version    # Should print 9.x or later
```

## Step 2: Clone the Repository

```bash
git clone <repository-url>
cd volleyball-ranking-engine
```

## Step 3: Install Dependencies

```bash
npm install
```

This installs all dependencies defined in `package.json`, including:

| Category   | Packages                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| Framework  | `svelte`, `@sveltejs/kit`, `@sveltejs/adapter-auto`, `@sveltejs/vite-plugin-svelte` |
| Build      | `vite`, `typescript`, `svelte-check`                                                |
| Styling    | `tailwindcss`, `@tailwindcss/vite`                                                  |
| Database   | `@supabase/supabase-js`                                                             |
| Validation | `zod`                                                                               |
| Testing    | `vitest`, `jsdom`, `@testing-library/svelte`, `@testing-library/jest-dom`           |
| Math       | `ml-matrix` (Colley Matrix LU decomposition)                                        |
| Export     | `jspdf`, `jspdf-autotable`, `xlsx`                                                  |

After install, `npm prepare` automatically runs `svelte-kit sync` to generate type declarations for `$lib`, `$env`, and route `$types` modules.

## Step 4: Set Up Supabase

Choose one of two approaches: a hosted Supabase project (simpler) or a local Supabase instance via the CLI (full offline support).

### Option A: Hosted Supabase Project

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **Settings > API** in your project dashboard.
3. Copy these three values:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **anon / public key** (the publishable API key)
   - **service_role key** (the secret server-side key)

### Option B: Local Supabase CLI

1. Install the Supabase CLI:

```bash
npm install -g supabase
# or via Homebrew on macOS:
brew install supabase/tap/supabase
```

2. Start the local Supabase stack:

```bash
supabase start
```

This launches local PostgreSQL, PostgREST, GoTrue (auth), and Studio containers. The CLI prints connection details including the API URL, anon key, and service role key.

The local configuration is defined in `supabase/config.toml`:

| Setting            | Value                       |
| ------------------ | --------------------------- |
| Project ID         | `volleyball-ranking-engine` |
| API port           | `54321`                     |
| DB port            | `54322`                     |
| Studio port        | `54323`                     |
| PostgreSQL version | 17                          |

## Step 5: Apply Database Migrations

The project includes 15 sequential PostgreSQL migrations in `supabase/migrations/`. These create the full schema: enums, tables, triggers, and RPC functions.

### Migration Files

| Migration                                    | Purpose                                           |
| -------------------------------------------- | ------------------------------------------------- |
| `..._create_updated_at_trigger_function.sql` | Shared `updated_at` auto-update trigger           |
| `..._create_age_group_enum.sql`              | `age_group` enum: 15U, 16U, 17U, 18U              |
| `..._create_ranking_scope_enum.sql`          | `ranking_scope` enum: single_season, cross_season |
| `..._create_seasons_table.sql`               | Seasons with year and name                        |
| `..._create_teams_table.sql`                 | Teams with name, code, region, age_group          |
| `..._create_tournaments_table.sql`           | Tournaments with FK to seasons                    |
| `..._create_tournament_weights_table.sql`    | Per-tournament weight multipliers                 |
| `..._create_tournament_results_table.sql`    | Team finish positions at tournaments              |
| `..._create_matches_table.sql`               | Individual match results (head-to-head)           |
| `..._create_ranking_runs_table.sql`          | Ranking computation snapshots                     |
| `..._create_ranking_results_table.sql`       | Per-team algorithm scores within a run            |
| `..._create_import_replace_rpc.sql`          | RPC function for atomic import upsert             |
| `..._add_ranking_run_status.sql`             | `status` column (draft/finalized) on ranking_runs |
| `..._create_ranking_overrides_table.sql`     | Committee override records with audit trail       |
| `..._add_age_group_to_ranking_runs.sql`      | `age_group` column on ranking_runs                |

### For Hosted Projects

Use the Supabase CLI to push migrations to your hosted project:

```bash
# Link to your hosted project (first time only)
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

### For Local Development

```bash
# Reset and reapply all migrations
supabase db reset
```

Or apply incrementally if the database already exists:

```bash
supabase db push --local
```

## Step 6: Configure Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**For local Supabase**, use the credentials printed by `supabase start`:

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>
```

### How Environment Variables Are Used

The project uses two Supabase client instances:

| Client           | File                         | Key Used                                                        | Context                                            |
| ---------------- | ---------------------------- | --------------------------------------------------------------- | -------------------------------------------------- |
| `supabase`       | `src/lib/supabase.ts`        | `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` via `import.meta.env` | Client-side (browser)                              |
| `supabaseServer` | `src/lib/supabase-server.ts` | `SUPABASE_SERVICE_ROLE_KEY` via `$env/static/private`           | Server-side only (`+server.ts`, `+page.server.ts`) |

The server client has elevated permissions and bypasses Row Level Security. Never expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.

### Security Notes

- The `.env` file is listed in `.gitignore`. Never commit it.
- `.gitignore` explicitly allows `.env.example` and `.env.test` files.
- Do not prefix secret keys with `PUBLIC_` or `VITE_` -- those prefixes expose variables to the browser bundle.

## Step 7: Start the Development Server

```bash
npm run dev
```

The Vite dev server starts at `http://localhost:5173` with hot module replacement (HMR) enabled.

Navigate to these pages to verify the application loads:

| URL                                     | Page                      |
| --------------------------------------- | ------------------------- |
| `http://localhost:5173/`                | Home page                 |
| `http://localhost:5173/import`          | Data import page          |
| `http://localhost:5173/ranking`         | Rankings dashboard        |
| `http://localhost:5173/ranking/weights` | Tournament weights editor |

If you see the navigation header and pages load without console errors, the environment is correctly configured.

## Step 8: Verify with Tests

Run the full test suite to confirm everything works:

```bash
npx vitest run
```

Expected output: **180 tests passing across 36 test files.**

Test categories:

| Category          | Location                        | Description                                         |
| ----------------- | ------------------------------- | --------------------------------------------------- |
| Algorithm tests   | `src/lib/ranking/__tests__/`    | Colley, Elo, normalization, edge cases, determinism |
| Component tests   | `src/lib/components/__tests__/` | UI rendering, accessibility, design tokens          |
| Import tests      | `src/lib/import/__tests__/`     | XLSX parsing, identity resolution, validation       |
| Export tests      | `src/lib/export/__tests__/`     | CSV/XLSX generation, data assembly                  |
| Schema tests      | `src/lib/schemas/__tests__/`    | Zod validation (valid/invalid inputs)               |
| Integration tests | `tests/integration/`            | SQL migration structural verification               |

If all tests pass, the local development environment is ready.

### Run Tests in Watch Mode

For active development, use watch mode to re-run affected tests on file save:

```bash
npx vitest
```

### Run a Single Test File

```bash
npx vitest run src/lib/ranking/__tests__/colley.test.ts
```

## Next Steps

- Read the [Developer Guide](./README.md) for project structure and common development tasks.
- Read the [Contributing Guidelines](./contributing.md) for code style and PR process.
- Review `CLAUDE.md` in the project root for domain terminology and architectural decisions.
