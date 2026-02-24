# Tasks: Design System & UI Foundation

> **Spec:** [spec.md](./spec.md)
> **Strategy:** squad | **Depth:** standard
> **Tech stack:** SvelteKit + Tailwind CSS v4 + Svelte 5 runes + TypeScript + Vitest + @testing-library/svelte

---

## Task Group 1: Design Tokens & Theme Configuration

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** None

Define all design tokens (color, typography, spacing) as CSS custom properties in `src/app.css` and map them into Tailwind v4's `@theme` block. This is the foundation layer -- all components and pages depend on these tokens being available as both CSS variables and Tailwind utility classes.

### Sub-tasks

- [ ] **1.1 Write 3 focused tests for design token availability**
      Create test file: `src/lib/components/__tests__/design-tokens.test.ts`
      Tests (Vitest, jsdom environment):
  1. **Test:** Import `src/app.css` and verify it contains all required color custom properties (`--color-bg`, `--color-surface`, `--color-surface-alt`, `--color-border`, `--color-border-strong`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-accent`, `--color-accent-hover`, `--color-accent-light`, `--color-success`, `--color-error`, `--color-warning`). Read the file content as a string and assert each token name is present.
  2. **Test:** Verify all tier color tokens are defined (`--color-tier-1`, `--color-tier-2`, `--color-tier-3`, `--color-tier-4`).
  3. **Test:** Verify spacing tokens (`--space-1` through `--space-12`) and typography tokens (`--text-h1` through `--text-stat`) are defined.

- [ ] **1.2 Define the color palette as CSS custom properties**
      Modify file: `src/app.css`
  - Add a `:root` block BEFORE the `@import 'tailwindcss'` line.
  - Define all 60-30-10 color tokens with the exact hex values from the spec:
    - Dominant (60%): `--color-bg: #FAFAFA`, `--color-surface: #FFFFFF`, `--color-surface-alt: #F5F5F5`
    - Secondary (30%): `--color-border: #E5E7EB`, `--color-border-strong: #D1D5DB`, `--color-text-primary: #111827`, `--color-text-secondary: #4B5563`, `--color-text-muted: #9CA3AF`
    - Accent (10%): `--color-accent: #2563EB`, `--color-accent-hover: #1D4ED8`, `--color-accent-light: #EFF6FF`, `--color-success: #16A34A`, `--color-error: #DC2626`, `--color-warning: #D97706`
    - Tier colors: `--color-tier-1: #FEF9C3`, `--color-tier-2: #E0F2FE`, `--color-tier-3: #F0FDF4`, `--color-tier-4: transparent`
  - No hardcoded color values -- all tokens defined once here.

- [ ] **1.3 Define typography scale tokens**
      Modify file: `src/app.css` (within the `:root` block)
  - Define font-size tokens: `--text-h1: 1.875rem`, `--text-h2: 1.25rem`, `--text-h3: 1.125rem`, `--text-body: 0.875rem`, `--text-caption: 0.75rem`, `--text-label: 0.875rem`, `--text-stat: 1.5rem`
  - Define corresponding line-height tokens: `--leading-h1: 1.2`, `--leading-h2: 1.3`, `--leading-h3: 1.4`, `--leading-body: 1.5`, `--leading-caption: 1.5`
  - Define font-weight tokens: `--font-normal: 400`, `--font-medium: 500`, `--font-semibold: 600`, `--font-bold: 700`
  - Define the system font stack: `--font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif`

- [ ] **1.4 Define spacing scale tokens**
      Modify file: `src/app.css` (within the `:root` block)
  - Define spacing tokens on a 4px base unit: `--space-1: 0.25rem`, `--space-2: 0.5rem`, `--space-3: 0.75rem`, `--space-4: 1rem`, `--space-6: 1.5rem`, `--space-8: 2rem`, `--space-12: 3rem`

- [ ] **1.5 Map tokens into Tailwind v4 `@theme` block**
      Modify file: `src/app.css`
  - Add a `@theme` block AFTER the `:root` block and BEFORE the `@import 'tailwindcss'` line.
  - Map color tokens to Tailwind: `--color-bg: var(--color-bg)`, `--color-surface: var(--color-surface)`, etc. This enables utilities like `bg-bg`, `bg-surface`, `text-accent`, `border-border`.
  - Map spacing tokens: `--spacing-1: var(--space-1)`, etc.
  - Map font-family: `--font-sans: var(--font-sans)`.
  - Keep the structure clean: group by color, typography, spacing with comment headers.

- [ ] **1.6 Ensure design token tests pass**
  - Run ONLY the 3 tests written in 1.1.
  - Verify the `src/app.css` file compiles without errors.
  - Do NOT run the entire test suite at this stage.

### Acceptance Criteria

- All color, typography, and spacing tokens are defined as CSS custom properties in `:root` in `src/app.css`.
- All tokens are mapped in a Tailwind v4 `@theme` block.
- The `@import 'tailwindcss'` line remains and is positioned after `:root` and `@theme`.
- No hardcoded hex color values exist outside of the `:root` token definitions.
- The 3 design token tests pass.

### Verification Steps

1. Read `src/app.css` and verify it contains a `:root` block with all required tokens -- expect 14 color tokens, 4 tier tokens, 7 font-size tokens, 7 spacing tokens.
2. Verify the `@theme` block maps all tokens to Tailwind-compatible names.
3. Run design token tests -- expect 3 tests pass, 0 failures.
4. Run `npx svelte-check` to ensure no type or compilation errors.

### Verification Commands

```bash
# Run design token tests
npx vitest run src/lib/components/__tests__/design-tokens.test.ts

# Type-check the project
npx svelte-check --tsconfig tsconfig.json

# Verify CSS compiles (start dev server briefly)
npm run build 2>&1 | head -20
```

---

## Task Group 2: Component Library

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** Task Group 1 (all design tokens must exist in `src/app.css`)

Build the reusable Svelte 5 component library: Button, Select, Card, Banner, PageHeader, NavHeader, PageShell, DataTable, RankBadge, TierRow, FreshnessIndicator, and Spinner. All components use design tokens (no hardcoded colors), Svelte 5 runes (`$props`, `$state`, `$derived`), TypeScript props, and Svelte 5 snippets for composable children.

### Sub-tasks

- [ ] **2.1 Write 8 focused tests for component library**
      Create test file: `src/lib/components/__tests__/design-system-components.test.ts`
      Tests (Vitest with `@testing-library/svelte`, jsdom environment, `cleanup()` after each test):
  1. **Test:** `Button` renders all four variants (primary, secondary, danger, ghost) and each variant applies the correct design-token-based classes. Render primary and assert the button element is present with accessible role.
  2. **Test:** `Button` in disabled state renders with `disabled` attribute and reduced opacity. Verify clicking a disabled button does NOT trigger the `onclick` callback.
  3. **Test:** `Banner` renders all four variants (success, error, warning, info) with the correct `role="alert"` attribute. Render error variant and assert the title text is visible.
  4. **Test:** `Card` renders children content via snippet. Render with header snippet and assert both header and body content are visible.
  5. **Test:** `NavHeader` renders navigation links for Import and Rankings. Assert both links are present with correct `href` values (`/import`, `/ranking`). Assert the active route link has a visually distinct style (e.g., `aria-current="page"`).
  6. **Test:** `RankBadge` renders the rank number. For rank <= 5, assert the badge has bold/emphasized styling. For rank > 5, assert standard styling.
  7. **Test:** `FreshnessIndicator` renders a relative time label. Pass a timestamp 5 minutes in the past and assert the rendered text contains a relative time string (e.g., "5 min ago" or similar).
  8. **Test:** `Select` renders with a label, options, and placeholder. Assert the label text is associated with the select element via `for`/`id` attributes. Verify the placeholder option is present.

- [ ] **2.2 Create the Spinner component**
      Create file: `src/lib/components/Spinner.svelte`
  - Props: `size?: 'sm' | 'md'` (default `'md'`)
  - Render an SVG loading spinner with `animate-spin` class.
  - Size mapping: `sm` = `h-4 w-4`, `md` = `h-6 w-6`.
  - Use `text-current` so the spinner inherits its parent's text color.
  - Replaces the repeated inline SVG spinner pattern found in 3+ places across `/import` and `/ranking` pages.

- [ ] **2.3 Create the Button component**
      Create file: `src/lib/components/Button.svelte`
  - Props: `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'` (default `'primary'`), `size?: 'sm' | 'md'` (default `'md'`), `disabled?: boolean`, `loading?: boolean`, `type?: 'button' | 'submit'` (default `'button'`), `onclick?: () => void`, `children: Snippet`
  - Variant styles (all referencing design tokens via Tailwind):
    - Primary: `bg-accent text-white hover:bg-accent-hover focus:ring-accent`
    - Secondary: `bg-surface text-text-secondary border border-border hover:bg-surface-alt focus:ring-accent`
    - Danger: `bg-error text-white hover:bg-red-700 focus:ring-error`
    - Ghost: `text-text-secondary hover:bg-surface-alt focus:ring-accent`
  - All variants: `rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200`
  - Size: `sm` = `px-3 py-1.5 text-xs`, `md` = `px-4 py-2 text-sm`
  - Disabled: `disabled:cursor-not-allowed disabled:opacity-50`, prevent `onclick` from firing.
  - Loading: Show `Spinner` (sm size) before children content, disable interaction.
  - Render children via `{@render children()}`.

- [ ] **2.4 Create the Select component**
      Create file: `src/lib/components/Select.svelte`
  - Props: `label: string`, `id: string`, `options: Array<{ value: string, label: string }>`, `value?: string` (bindable via `$bindable()`), `placeholder?: string`, `disabled?: boolean`, `error?: string`
  - Render a `<label>` with `for={id}` and text styled with `text-label` token.
  - Render a `<select>` with `id={id}`, bound to `value`.
  - Style: `rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:bg-surface-alt`
  - If `placeholder`, render a disabled `<option value="">` with placeholder text.
  - If `error`, render a `<p>` below the select with error text in `text-error text-caption`.
  - Replace the repeated label+select markup found 5+ times across both pages.

- [ ] **2.5 Create the Card component**
      Create file: `src/lib/components/Card.svelte`
  - Props: `header?: Snippet`, `children: Snippet`, `padding?: 'default' | 'none'` (default `'default'`)
  - Render a `<div>` with `rounded-lg border border-border bg-surface shadow-sm`.
  - If `header` snippet is provided, render it inside a header section with bottom border.
  - Content area padding: `default` = `p-6`, `none` = `p-0` (for tables that need full-bleed content).
  - Render children via `{@render children()}`.
  - Replaces the repeated `rounded-lg border border-gray-200 bg-white p-6 shadow-sm` pattern.

- [ ] **2.6 Create the Banner component**
      Create file: `src/lib/components/Banner.svelte`
  - Props: `variant: 'success' | 'error' | 'warning' | 'info'`, `title?: string`, `children: Snippet`, `dismissible?: boolean`
  - Variant styles (using design tokens):
    - Success: `bg-green-50 border-success text-green-800` with checkmark icon.
    - Error: `bg-red-50 border-error text-red-800` with exclamation icon.
    - Warning: `bg-amber-50 border-warning text-amber-800` with warning icon.
    - Info: `bg-accent-light border-accent text-blue-800` with info icon.
  - Render with `role="alert"` for accessibility.
  - Include an inline SVG icon for each variant (reuse the existing error icon pattern from the pages).
  - If `dismissible`, render a close button that hides the banner (internal `$state` for visibility).
  - If `title`, render it as a `<h3>` with semibold weight.
  - Render children via `{@render children()}` as the message body.

- [ ] **2.7 Create the PageHeader component**
      Create file: `src/lib/components/PageHeader.svelte`
  - Props: `title: string`, `subtitle?: string`
  - Render `<h1>` with `text-h1` size, `font-bold`, `text-text-primary`.
  - If `subtitle`, render `<p>` with `text-body`, `text-text-secondary`, `mt-2`.
  - Wrap in a `<div>` with `mb-8` bottom margin.
  - Replaces the repeated `<h1>` + `<p>` pattern found at the top of both pages.

- [ ] **2.8 Create the NavHeader component**
      Create file: `src/lib/components/NavHeader.svelte`
  - Props: `currentPath: string`
  - Render a `<nav>` element with `aria-label="Main navigation"`.
  - Container: full-width background with `bg-surface border-b border-border`.
  - Inner: centered content with `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.
  - Left side: App title "Volleyball Rankings" as a link to `/`.
  - Right side: Navigation links for "Import" (`/import`) and "Rankings" (`/ranking`).
  - Active link detection: Compare `currentPath` against link href. Active link gets `text-accent border-b-2 border-accent` styling and `aria-current="page"`.
  - Inactive links: `text-text-secondary hover:text-text-primary`.
  - All links must be keyboard-navigable with visible focus indicators (`focus:ring-2 focus:ring-accent`).
  - Height: `h-16` for consistent vertical rhythm.

- [ ] **2.9 Create the PageShell component**
      Create file: `src/lib/components/PageShell.svelte`
  - Props: `children: Snippet`
  - Render structure: `<div class="min-h-screen bg-bg">` wrapping a `<main>` with the container pattern (`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`).
  - Note: NavHeader is NOT rendered here -- it is placed in `+layout.svelte` above PageShell, so the nav is outside the main content area.
  - Render children via `{@render children()}` inside `<main>`.

- [ ] **2.10 Create the DataTable component**
      Create file: `src/lib/components/DataTable.svelte`
  - Props: `children: Snippet`, `caption?: string`, `stickyHeader?: boolean` (default `true`)
  - Render a wrapper `<div>` with `overflow-x-auto rounded-lg border border-border bg-surface shadow-sm`.
  - Inside, render a `<table>` with `min-w-full divide-y divide-border`.
  - If `caption`, render a `<caption>` element with `sr-only` class (visible to screen readers, hidden visually).
  - If `stickyHeader`, apply `sticky top-0` to `<thead>` via a CSS class that children can reference.
  - Render children (which will be `<thead>` and `<tbody>`) via `{@render children()}`.
  - This component provides the chrome (border, scroll, sticky) -- actual table rows are composed inside it.

- [ ] **2.11 Create the RankBadge component**
      Create file: `src/lib/components/RankBadge.svelte`
  - Props: `rank: number`
  - Render the rank number inside a `<span>`.
  - For ranks 1-5: `font-bold text-lg text-text-primary` (visually emphasized).
  - For ranks 6+: `font-medium text-sm text-text-secondary` (standard).
  - Use `tabular-nums` font feature for consistent numeric alignment.
  - Wrap in a minimum-width container for visual alignment in the table column.

- [ ] **2.12 Create the TierRow component**
      Create file: `src/lib/components/TierRow.svelte`
  - Props: `rank: number`, `children: Snippet`
  - Render a `<tr>` element with a tier-based background color:
    - Rank 1-5: `bg-tier-1` (warm gold tint `--color-tier-1`)
    - Rank 6-15: `bg-tier-2` (cool blue tint `--color-tier-2`)
    - Rank 16-30: `bg-tier-3` (light green tint `--color-tier-3`)
    - Rank 31+: transparent (default surface, no tint)
  - Use `$derived` to compute the tier class from the rank prop.
  - Render children (table cells) via `{@render children()}`.

- [ ] **2.13 Create the FreshnessIndicator component**
      Create file: `src/lib/components/FreshnessIndicator.svelte`
  - Props: `timestamp: string` (ISO 8601 string)
  - Compute relative time from the timestamp using a simple function (no external library):
    - < 1 min: "Just now"
    - < 60 min: "X min ago"
    - < 24 hours: "X hours ago"
    - > = 24 hours: "X days ago"
  - Render as a `<time>` element with `datetime` attribute set to the ISO timestamp.
  - Style: `text-caption text-text-muted` with a small clock icon (inline SVG) prefix.

- [ ] **2.14 Ensure component library tests pass**
  - Run ONLY the 8 tests written in 2.1.
  - Verify all components compile without errors.
  - Do NOT run the entire test suite at this stage.

### Acceptance Criteria

- All 12 components exist in `src/lib/components/` with PascalCase filenames.
- All components use Svelte 5 runes (`$props`, `$state`, `$derived`) -- no legacy `export let` syntax.
- All components use Svelte 5 snippets (`{#snippet}` / `{@render}`) for composable content -- no `<slot>` elements.
- All components use TypeScript for prop type definitions.
- No hardcoded hex color values in any component template -- all colors reference design tokens via Tailwind classes.
- All components with interactive elements have visible focus indicators.
- Banner component has `role="alert"` for screen reader announcements.
- NavHeader has `aria-current="page"` on the active link and `aria-label` on the `<nav>`.
- DataTable uses semantic `<caption>` for screen reader context.
- All 8 component tests pass.

### Verification Steps

1. Import each component in a test file and render it -- expect no import or compilation errors.
2. Render `Button` with each variant (primary, secondary, danger, ghost) -- expect each to display with distinct styling and no hardcoded colors.
3. Render `NavHeader` with `currentPath="/import"` -- expect the Import link to have `aria-current="page"` and accent styling.
4. Render `RankBadge` with rank=1 -- expect bold/large styling. Render with rank=10 -- expect standard styling.
5. Render `TierRow` with rank=3 -- expect gold tint background. Render with rank=20 -- expect green tint.
6. Render `FreshnessIndicator` with a timestamp 5 minutes ago -- expect "5 min ago" text.
7. Run all 8 component tests -- expect 0 failures.

### Verification Commands

```bash
# Run component library tests
npx vitest run src/lib/components/__tests__/design-system-components.test.ts

# Type-check all Svelte components
npx svelte-check --tsconfig tsconfig.json

# Verify build succeeds
npm run build 2>&1 | head -20
```

---

## Task Group 3: Page Retrofitting & Layout Integration

**Assigned implementer:** `ui-designer`
**Verified by:** `frontend-verifier`
**Dependencies:** Task Group 1 (design tokens), Task Group 2 (all components must exist)

Apply the design system to the existing `/import` and `/ranking` pages. Update `+layout.svelte` to include NavHeader and PageShell. Replace all ad-hoc inline Tailwind classes with design-system component usage. Add tier color coding to the ranking table. Ensure responsive behavior at mobile, tablet, and desktop breakpoints.

### Sub-tasks

- [ ] **3.1 Write 5 focused tests for page retrofitting**
      Create test file: `src/lib/components/__tests__/page-retrofit.test.ts`
      Tests (Vitest with `@testing-library/svelte`, jsdom environment, `cleanup()` after each test):
  1. **Test:** `RankingResultsTable` renders tier-colored rows. Pass results with ranks 1, 10, 20, and 35. Assert that the row for rank 1 has the tier-1 background class, rank 10 has tier-2, rank 20 has tier-3, and rank 35 has no tier color (transparent/default).
  2. **Test:** `RankingResultsTable` renders `RankBadge` components in the rank column. Pass results with rank 1 and rank 15. Assert the rank 1 badge has bold styling and the rank 15 badge has standard styling.
  3. **Test:** `RankingResultsTable` uses semantic table markup. Assert the rendered table contains `<thead>`, `<th>` elements with appropriate scope attributes, and a `<caption>` element (or `aria-label` on the table).
  4. **Test:** Verify no hardcoded gray/blue hex values remain in the `RankingResultsTable` component. Read the component file as a string and assert it does not contain patterns like `#111827`, `#4B5563`, `bg-gray-`, `text-gray-`, `border-gray-`, `bg-blue-`, `text-blue-`.
  5. **Test:** `PageShell` renders children inside a main element with the container pattern. Assert the `<main>` element exists and contains the children content.

- [ ] **3.2 Update `+layout.svelte` with NavHeader and PageShell**
      Modify file: `src/routes/+layout.svelte`
  - Import `NavHeader` and `PageShell` from `$lib/components/`.
  - Import `page` from `$app/stores` or use `$page.url.pathname` (Svelte 5 way) to get the current route path.
  - Render `NavHeader` with `currentPath={$page.url.pathname}` at the top.
  - Wrap `{@render children()}` inside `PageShell`.
  - Keep the existing `<svelte:head>` block with favicon.
  - Remove any existing container/wrapper patterns from the layout if present (they are now in PageShell).

- [ ] **3.3 Retrofit the `/import` page with design-system components**
      Modify file: `src/routes/import/+page.svelte`
  - Replace the manual page container `<div class="mx-auto max-w-7xl ...">` -- this is now provided by PageShell in the layout.
  - Replace the manual `<h1>` + `<p>` page title with `<PageHeader title="Import Data" subtitle="Upload Excel spreadsheets to import tournament results or ranking data." />`.
  - Replace all `<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">` wrappers with `<Card>` components. For the Import Settings section, use `<Card>` with a header snippet containing the `<h2>`.
  - Replace all `<label>` + `<select>` markup for Season, Age Group, and Format dropdowns with `<Select>` components, passing `label`, `id`, `options`, `value`, `placeholder`, and `disabled` props.
  - Replace the error banner (step === 'error') with `<Banner variant="error" title="Import Error">` wrapping the error message and retry button. The retry button uses `<Button variant="danger">`.
  - Replace the "Cancel" button with `<Button variant="secondary">Cancel</Button>`.
  - Replace the "Confirm Import" button with `<Button variant="primary" disabled={!canConfirm}>Confirm Import</Button>`.
  - Replace the "Try Again" button with `<Button variant="danger">Try Again</Button>`.
  - Replace the inline SVG spinner (step === 'importing') with the `<Spinner>` component.
  - Ensure all color references use design token classes, not hardcoded gray/blue values.

- [ ] **3.4 Retrofit the `/ranking` page with design-system components**
      Modify file: `src/routes/ranking/+page.svelte`
  - Remove the manual page container `<div class="mx-auto max-w-7xl ...">` -- provided by PageShell.
  - Replace the manual `<h1>` + `<p>` with `<PageHeader title="Rankings" subtitle="Run ranking algorithms to compute team ratings and aggregate rankings." />`.
  - Replace the settings card wrapper with `<Card>` component.
  - Replace the Season and Age Group `<label>` + `<select>` blocks with `<Select>` components.
  - Replace the error banner with `<Banner variant="error" title="Ranking Error">`.
  - Replace the success banner (`runSummary`) with `<Banner variant="success">` containing the summary text.
  - Replace the "Run Rankings" button with `<Button variant="primary" disabled={!contextReady || step === 'running'} loading={step === 'running'}>Run Rankings</Button>`.
  - Replace the "Run Again" button with `<Button variant="primary">Run Again</Button>`.
  - Replace the "Try Again" button with `<Button variant="danger">Try Again</Button>`.
  - Replace the inline SVG spinner with `<Spinner>` via the Button's `loading` prop.
  - Add `<FreshnessIndicator timestamp={runSummary.ran_at} />` near the results summary.

- [ ] **3.5 Enhance `RankingResultsTable` with tier colors and rank badges**
      Modify file: `src/lib/components/RankingResultsTable.svelte`
  - Import `TierRow`, `RankBadge`, and `DataTable` components.
  - Wrap the existing `<table>` inside a `<DataTable caption="Ranking results">` component.
  - Replace the plain `<tr>` rows with `<TierRow rank={row.agg_rank}>` to apply tier background colors.
  - Replace the rank number `<td>` content with `<RankBadge rank={row.agg_rank} />`.
  - Add `font-semibold` to the AggRating column cell for visual emphasis.
  - Replace all hardcoded Tailwind color classes:
    - `bg-gray-50` (zebra rows) -> use TierRow for tier colors (tier colors replace zebra striping for ranked rows).
    - `text-gray-900` -> `text-text-primary`
    - `text-gray-700` -> `text-text-secondary`
    - `text-gray-600` -> `text-text-muted`
    - `text-gray-500` -> `text-text-muted`
    - `divide-gray-200` -> `divide-border`
    - `divide-gray-100` -> `divide-border`
    - `bg-gray-50` (thead) -> `bg-surface-alt`
    - `border-gray-200` -> `border-border`
  - Add `<th scope="col">` to all header cells for accessibility.
  - Ensure `tabular-nums` remains on all numeric columns.

- [ ] **3.6 Apply responsive behavior to the ranking table**
      Modify file: `src/lib/components/RankingResultsTable.svelte`
  - Mobile (< 640px): Hide per-algorithm columns (Colley Rating/Rank, Elo-2200 through Elo-2700 Rating/Rank). Show only AggRank, Team Name, AggRating, and optionally W/L Record. Use Tailwind responsive utilities: `hidden sm:table-cell` on algorithm columns.
  - Tablet (640px - 1024px): Show key columns, allow horizontal scroll for remaining algorithm columns.
  - Desktop (> 1024px): All columns visible. Horizontal scroll available via DataTable wrapper if content overflows.
  - Ensure the first two columns (Rank, Team Name) remain visible at all viewport sizes.

- [ ] **3.7 Remove hardcoded colors from existing components**
      Modify files: `src/lib/components/FileDropZone.svelte`, `src/lib/components/DataPreviewTable.svelte`, `src/lib/components/ImportSummary.svelte`, `src/lib/components/IdentityResolutionPanel.svelte`
  - In each file, replace all hardcoded Tailwind color classes with design-token-based equivalents:
    - `bg-blue-600` -> `bg-accent`, `hover:bg-blue-700` -> `hover:bg-accent-hover`
    - `text-blue-600` -> `text-accent`, `focus:ring-blue-500` -> `focus:ring-accent`
    - `bg-white` -> `bg-surface`, `bg-gray-50` -> `bg-surface-alt`
    - `border-gray-200` -> `border-border`, `border-gray-300` -> `border-border-strong`
    - `text-gray-900` -> `text-text-primary`, `text-gray-700` -> `text-text-secondary`, `text-gray-600` -> `text-text-secondary`, `text-gray-500` -> `text-text-muted`
    - `bg-red-50` -> use Banner component or `bg-red-50` with error token border.
    - `bg-green-50` -> use Banner component or `bg-green-50` with success token border.
  - Where possible, replace inline button markup with `<Button>` components and inline select markup with `<Select>` components.

- [ ] **3.8 Ensure page retrofitting tests pass**
  - Run ONLY the 5 tests written in 3.1.
  - Verify both pages render without errors.
  - Do NOT run the entire test suite at this stage.

### Acceptance Criteria

- `+layout.svelte` renders NavHeader at the top of every page with the active route highlighted.
- `/import` page uses PageHeader, Card, Select, Button, Banner, and Spinner components -- no ad-hoc inline Tailwind for these patterns.
- `/ranking` page uses PageHeader, Card, Select, Button, Banner, FreshnessIndicator, and Spinner components.
- `RankingResultsTable` displays tier-colored rows (gold for 1-5, blue for 6-15, green for 16-30, transparent for 31+).
- `RankingResultsTable` uses RankBadge for the rank column with emphasized styling for top-5 ranks.
- `RankingResultsTable` hides algorithm detail columns on mobile and shows them on larger viewports.
- No hardcoded color hex values remain in any `.svelte` component template.
- Both pages render identically to their current appearance (or better).
- All 5 page retrofitting tests pass.

### Verification Steps

1. Start dev server and navigate to `/import` -- expect NavHeader visible at top, page title uses PageHeader, settings section uses Card and Select components.
2. Navigate to `/ranking` -- expect same NavHeader, active link highlights "Rankings", settings use Card and Select.
3. Run rankings and view results -- expect tier color bands on rows (gold for top 5, blue for 6-15, etc.).
4. Resize browser to 375px width on ranking results -- expect only AggRank, Team Name, and AggRating columns visible.
5. View page source or inspect elements -- expect no hardcoded `text-gray-900`, `bg-blue-600`, etc. All should reference design token classes.
6. Run tests -- expect 5 tests pass, 0 failures.

### Verification Commands

```bash
# Run page retrofitting tests
npx vitest run src/lib/components/__tests__/page-retrofit.test.ts

# Type-check all components
npx svelte-check --tsconfig tsconfig.json

# Start dev server for visual inspection
npm run dev
# Open http://localhost:5173/import and http://localhost:5173/ranking

# Verify build succeeds
npm run build
```

---

## Task Group 4: Test Review & Gap Analysis

**Assigned implementer:** `testing-engineer`
**Verified by:** none (final quality gate)
**Dependencies:** Task Groups 1, 2, and 3 must be complete (all implementation and their embedded tests).

Review all tests written by Groups 1-3 (3 token tests + 8 component tests + 5 page tests = 16 tests), identify critical gaps in coverage, and add up to 10 gap-filling tests focused on accessibility audits, contrast verification, and component interaction edge cases.

### Sub-tasks

- [ ] **4.1 Audit existing test coverage**
      Review all test files:
  - `src/lib/components/__tests__/design-tokens.test.ts` (3 tests)
  - `src/lib/components/__tests__/design-system-components.test.ts` (8 tests)
  - `src/lib/components/__tests__/page-retrofit.test.ts` (5 tests)
    Document which paths are covered and which critical paths are missing. Focus on: accessibility compliance, WCAG contrast ratios, keyboard navigation, component interaction edge cases, and responsive behavior verification.

- [ ] **4.2 Write accessibility audit tests**
      Create test file: `src/lib/components/__tests__/accessibility.test.ts`
      Tests (Vitest with `@testing-library/svelte`, jsdom environment, `cleanup()` after each):
  1. **Test:** `Button` has accessible name derived from children content. Render a Button with text "Submit" and assert `getByRole('button', { name: 'Submit' })` succeeds.
  2. **Test:** `NavHeader` keyboard navigation. Render NavHeader and verify all links are focusable via tab order. Assert each link has a visible `focus` style indicator (the element receives focus when tabbed to).
  3. **Test:** `Select` associates label with select element. Render Select with `label="Season"` and `id="season"`. Assert `getByLabelText('Season')` returns the select element.
  4. **Test:** `Banner` with `role="alert"` is announced to screen readers. Render an error Banner and assert `getByRole('alert')` succeeds and contains the title and message text.

- [ ] **4.3 Write contrast verification tests**
      Create test file: `src/lib/components/__tests__/contrast.test.ts`
      Tests: 5. **Test:** Verify all text/background color pairings from the design tokens meet WCAG AA contrast ratio (4.5:1 for normal text). Test the following pairings by computing contrast ratios from hex values:
  - `--color-text-primary` (#111827) on `--color-bg` (#FAFAFA) -- expect >= 4.5
  - `--color-text-primary` (#111827) on `--color-surface` (#FFFFFF) -- expect >= 4.5
  - `--color-text-secondary` (#4B5563) on `--color-surface` (#FFFFFF) -- expect >= 4.5
  - `--color-text-muted` (#9CA3AF) on `--color-surface` (#FFFFFF) -- expect >= 3.0 (large text threshold, since muted text is used for captions)
  - `--color-accent` (#2563EB) on `--color-surface` (#FFFFFF) -- expect >= 4.5
  - `--color-error` (#DC2626) on `--color-surface` (#FFFFFF) -- expect >= 4.5
  - White text (#FFFFFF) on `--color-accent` (#2563EB) -- expect >= 4.5
  - White text (#FFFFFF) on `--color-error` (#DC2626) -- expect >= 4.5
  6. **Test:** Verify tier color backgrounds maintain text readability. Test `--color-text-primary` (#111827) against each tier background:
     - On `--color-tier-1` (#FEF9C3) -- expect >= 4.5
     - On `--color-tier-2` (#E0F2FE) -- expect >= 4.5
     - On `--color-tier-3` (#F0FDF4) -- expect >= 4.5

- [ ] **4.4 Write component edge case tests**
      Create test file: `src/lib/components/__tests__/component-edge-cases.test.ts`
      Tests: 7. **Test:** `FreshnessIndicator` handles edge cases: pass a timestamp from exactly now (expect "Just now"), from 90 minutes ago (expect "1 hours ago" or similar), and from 2 days ago (expect "2 days ago"). 8. **Test:** `TierRow` boundary values. Render TierRow with rank=5 (expect tier-1), rank=6 (expect tier-2), rank=15 (expect tier-2), rank=16 (expect tier-3), rank=30 (expect tier-3), rank=31 (expect tier-4/transparent). 9. **Test:** `Card` with `padding="none"` renders children without padding wrapper. Assert the content container does NOT have `p-6` class. 10. **Test:** `Button` with `loading={true}` renders a spinner element and disables click interaction. Click the button and verify the `onclick` callback was NOT called.

- [ ] **4.5 Run complete feature test suite**
      Run ALL tests across all groups:
  - `src/lib/components/__tests__/design-tokens.test.ts` (3 tests)
  - `src/lib/components/__tests__/design-system-components.test.ts` (8 tests)
  - `src/lib/components/__tests__/page-retrofit.test.ts` (5 tests)
  - `src/lib/components/__tests__/accessibility.test.ts` (4 tests)
  - `src/lib/components/__tests__/contrast.test.ts` (2 tests)
  - `src/lib/components/__tests__/component-edge-cases.test.ts` (4 tests)
    Expected total: 26 tests. Verify zero failures and no test isolation issues (tests do not depend on each other's state). Document final test counts.

### Acceptance Criteria

- Gap analysis is documented with clear rationale for each added test.
- Up to 10 additional tests are written, covering: accessibility compliance, WCAG contrast verification, keyboard navigation, and component edge cases.
- All new tests follow Arrange-Act-Assert pattern.
- No test depends on another test's state or ordering.
- The full test suite (all 4 groups) passes in a single run with zero failures.
- All text/background color pairings meet WCAG AA contrast ratios.
- All interactive components (Button, Select, NavHeader links) have accessible names and keyboard operability.

### Verification Steps

1. Run the complete Vitest suite for all design system tests. Expected: all 26 tests pass with zero failures.
2. Verify no test pollutes global state by running the suite twice consecutively -- expect identical results both times.
3. Confirm total test count is between 16 and 26 (16 from Groups 1-3 + up to 10 from Group 4).
4. Review contrast test results -- expect all WCAG AA pairings to pass.

### Verification Commands

```bash
# Run all design system tests
npx vitest run src/lib/components/__tests__/design-tokens.test.ts
npx vitest run src/lib/components/__tests__/design-system-components.test.ts
npx vitest run src/lib/components/__tests__/page-retrofit.test.ts
npx vitest run src/lib/components/__tests__/accessibility.test.ts
npx vitest run src/lib/components/__tests__/contrast.test.ts
npx vitest run src/lib/components/__tests__/component-edge-cases.test.ts

# Run all design system tests in a single command
npx vitest run src/lib/components/__tests__/

# Run twice to verify no state pollution
npx vitest run src/lib/components/__tests__/ && npx vitest run src/lib/components/__tests__/

# Type-check the entire project
npx svelte-check --tsconfig tsconfig.json

# Build the project to verify no compilation errors
npm run build
```

---

## Summary

| Group                         | Implementer        | Focus                                       | Sub-tasks | Tests    | Depends On     |
| ----------------------------- | ------------------ | ------------------------------------------- | --------- | -------- | -------------- |
| 1. Design Tokens & Theme      | `ui-designer`      | CSS custom properties, Tailwind v4 `@theme` | 6         | 3        | None           |
| 2. Component Library          | `ui-designer`      | 12 Svelte 5 components                      | 14        | 8        | Group 1        |
| 3. Page Retrofitting          | `ui-designer`      | Apply design system to pages, layout        | 8         | 5        | Groups 1, 2    |
| 4. Test Review & Gap Analysis | `testing-engineer` | Accessibility, contrast, edge cases         | 5         | up to 10 | Groups 1, 2, 3 |

**Total sub-tasks:** 33
**Total tests:** 16 (Groups 1-3) + up to 10 (Group 4) = up to 26

### Dependency Graph

```
(no external dependencies -- this is a purely frontend feature)
    |
    v
Group 1: Design Tokens & Theme (ui-designer)
    |
    v
Group 2: Component Library (ui-designer)
    |
    v
Group 3: Page Retrofitting & Layout Integration (ui-designer)
    |
    v
Group 4: Test Review & Gap Analysis (testing-engineer)
```

### Existing Code Modified

| Asset                     | Location                                            | Design System Action                                                             |
| ------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------- |
| `app.css`                 | `src/app.css`                                       | Add `:root` tokens + `@theme` block before `@import 'tailwindcss'`               |
| `+layout.svelte`          | `src/routes/+layout.svelte`                         | Add NavHeader + PageShell wrapper                                                |
| `/import` page            | `src/routes/import/+page.svelte`                    | Replace ad-hoc markup with Card, Select, Button, Banner, PageHeader              |
| `/ranking` page           | `src/routes/ranking/+page.svelte`                   | Replace ad-hoc markup, add FreshnessIndicator                                    |
| `RankingResultsTable`     | `src/lib/components/RankingResultsTable.svelte`     | Add TierRow, RankBadge, DataTable, responsive column hiding, design token colors |
| `FileDropZone`            | `src/lib/components/FileDropZone.svelte`            | Replace hardcoded colors with design token references                            |
| `DataPreviewTable`        | `src/lib/components/DataPreviewTable.svelte`        | Replace hardcoded colors with design token references                            |
| `ImportSummary`           | `src/lib/components/ImportSummary.svelte`           | Replace hardcoded colors with design token references                            |
| `IdentityResolutionPanel` | `src/lib/components/IdentityResolutionPanel.svelte` | Replace hardcoded colors with design token references                            |

### New Components Created

| Component                   | Location                                       | Purpose                                        |
| --------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `Button.svelte`             | `src/lib/components/Button.svelte`             | Primary/secondary/danger/ghost button variants |
| `Select.svelte`             | `src/lib/components/Select.svelte`             | Labeled select with error state                |
| `Card.svelte`               | `src/lib/components/Card.svelte`               | Bordered surface container                     |
| `Banner.svelte`             | `src/lib/components/Banner.svelte`             | Success/error/warning/info alert               |
| `PageHeader.svelte`         | `src/lib/components/PageHeader.svelte`         | H1 + subtitle page title                       |
| `NavHeader.svelte`          | `src/lib/components/NavHeader.svelte`          | Persistent navigation bar                      |
| `PageShell.svelte`          | `src/lib/components/PageShell.svelte`          | Page wrapper with container                    |
| `DataTable.svelte`          | `src/lib/components/DataTable.svelte`          | Table chrome with scroll/sticky                |
| `RankBadge.svelte`          | `src/lib/components/RankBadge.svelte`          | Styled rank number                             |
| `TierRow.svelte`            | `src/lib/components/TierRow.svelte`            | Tier-colored table row                         |
| `FreshnessIndicator.svelte` | `src/lib/components/FreshnessIndicator.svelte` | Relative timestamp display                     |
| `Spinner.svelte`            | `src/lib/components/Spinner.svelte`            | Loading spinner                                |
