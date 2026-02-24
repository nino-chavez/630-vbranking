# Tech Stack

## Architecture Decision: All-TypeScript

This project is algorithm-heavy (Colley Matrix requires solving a linear system; Elo variants require iterative rating calculations). Two approaches were evaluated:

**Option A: Python backend + TypeScript frontend** -- Python has superior numerical libraries (NumPy, SciPy) for linear algebra. However, this introduces a second language, a separate deployment target, cross-language API contracts, and additional infrastructure complexity.

**Option B: All-TypeScript (chosen)** -- The Colley Matrix for 73 teams produces a 73x73 linear system, which is trivially small for any language. TypeScript libraries like `ml-matrix` (LU decomposition, matrix inversion) handle this scale without performance concerns. The Elo calculations are simple arithmetic. Keeping a single language across the entire stack reduces complexity, enables shared types between frontend and backend, and aligns with the user's existing expertise and tooling.

**Verdict:** All-TypeScript. The mathematical complexity of this project does not warrant a second language. The matrices are small, the algorithms are well-defined, and the benefits of a unified stack (shared types, single deployment, one test framework) outweigh the marginal convenience of Python's numerical ecosystem.

## Frontend

- **Framework:** SvelteKit (full-stack framework providing both SSR pages and API routes)
- **Language:** TypeScript (strict mode enabled)
- **Styling:** Tailwind CSS
- **State Management:** SvelteKit built-in stores and load functions
- **Schema Validation:** Zod (for form inputs, file upload validation, API request/response typing)

## Backend

- **Runtime:** Node.js (via SvelteKit server routes and API endpoints)
- **Framework:** SvelteKit (server-side routes, form actions, API routes under `+server.ts`)
- **Database:** Supabase (PostgreSQL) -- managed hosting, row-level security, built-in auth if needed later
- **ORM / Query Builder:** Supabase JS client (`@supabase/supabase-js`) for database queries
- **File Parsing:** `xlsx` (SheetJS) for Excel file parsing; `csv-parse` for CSV ingestion
- **Linear Algebra:** `ml-matrix` for Colley Matrix construction and solving (LU decomposition)
- **Math Utilities:** Native TypeScript for Elo calculations (simple arithmetic, no library needed)

## Testing

- **Unit Tests:** Vitest -- for algorithm correctness (Colley ratings, Elo calculations, aggregation logic), data parsing, and utility functions
- **E2E Tests:** Playwright -- for dashboard interactions, file upload flows, and export functionality
- **Validation:** Zod schemas shared between frontend forms and backend API handlers

## Deployment

- **Platform:** Vercel (native SvelteKit adapter support, serverless functions for API routes)
- **CI/CD:** GitHub Actions (lint, type-check, test on PR; deploy on merge to main)
- **Environment Management:** Vercel environment variables for Supabase credentials

## Code Quality

- **Formatter:** Prettier (2-space indentation, single quotes, semicolons)
- **Linter:** ESLint with TypeScript plugin
- **Type Checking:** TypeScript strict mode (`strict: true` in tsconfig)
- **Import Style:** Absolute imports via path aliases (`$lib/`, `$app/`)

## Key Libraries

| Purpose | Library | Reason |
|---|---|---|
| Excel parsing | `xlsx` (SheetJS) | Industry standard for reading .xlsx files in JS/TS |
| CSV parsing | `csv-parse` | Streaming CSV parser with TypeScript types |
| Linear algebra | `ml-matrix` | Pure JS matrix operations, LU decomposition for Colley system |
| Schema validation | `zod` | TypeScript-first validation with type inference |
| Database client | `@supabase/supabase-js` | Official Supabase client with TypeScript types |
| PDF export | `pdfkit` or `@react-pdf/renderer` | For generating ranking report PDFs (evaluate during implementation) |
