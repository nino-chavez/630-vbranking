# Specification: Design System & UI Foundation

## Goal

Establish a cohesive visual design system -- design tokens, layout primitives, component patterns, and a ranking-specific visual language -- following the Clarity → Trust → Action framework, so that the existing `/import` and `/ranking` pages and all future UI are built from a single, consistent, maintainable foundation.

## User Stories

- As a **ranking committee member**, I want the rankings table to have a clear visual hierarchy so I can scan AggRank, team name, and AggRating without reading every column.
- As a **ranking committee member**, I want tier-based color coding on rankings so I can instantly see which teams are top-tier, mid-tier, and lower-tier.
- As a **ranking committee member**, I want the import and ranking pages to look and feel like the same application so I trust the system as a cohesive tool.
- As a **ranking committee member reviewing on mobile**, I want the rankings table to remain usable on a phone so I can check standings from the gym.
- As a **ranking committee member**, I want timestamps and data-freshness indicators styled consistently so I trust the data I am reviewing.
- As a **committee chair**, I want navigation between Import, Rankings, and future pages to be obvious and persistent so the workflow is friction-free.

## Core Requirements

### Functional Requirements

#### 1. Design Tokens

- Define a complete color palette as CSS custom properties in `src/app.css`, following the 60-30-10 rule (see Visual Design section below).
- Define a typography scale as CSS custom properties (font sizes, line heights, font weights).
- Define a spacing scale as CSS custom properties (4px base unit).
- Map all tokens into Tailwind v4's `@theme` block in `src/app.css` so they are available as utility classes.

#### 2. Layout Primitives

- **Page shell**: A top-level layout component with persistent navigation header and main content area.
- **Container**: Centered max-width container (`max-w-7xl`) with responsive horizontal padding. This pattern already exists in both pages and should be extracted.
- **Responsive grid**: Utility patterns for 1/2/3-column layouts that collapse on mobile (already partially used in `/import` settings panel).

#### 3. Component Patterns

Define reusable Svelte 5 components for:

- **Button** -- Primary, secondary, danger, ghost variants. Consistent sizing, focus rings, disabled states. Replace the ad-hoc button styles scattered across `/import` and `/ranking`.
- **Select / Input** -- Styled form controls with label, helper text, and error state. Replace the repeated select markup in both pages.
- **Card** -- Bordered surface container with optional header. Replace the repeated `rounded-lg border border-gray-200 bg-white shadow-sm` pattern.
- **Banner** -- Success, error, warning, and info variants. Replace the ad-hoc error and success banners in both pages.
- **Data table** -- Wrapper component for the ranking-style dense data table with sticky headers, zebra rows, and horizontal scroll on small screens. Enhance `RankingResultsTable`.
- **Navigation header** -- Persistent top bar with app title, page links (Import, Rankings), and active-page indicator.
- **Page header** -- H1 + subtitle pattern used at the top of every page.

#### 4. Ranking Visual Language

- **Tier color bands**: Apply background or left-border color coding to ranking table rows based on rank position (e.g., top 5, 6-15, 16-30, 31+). Colors must be distinct but not overwhelming -- subtle background tints, not saturated fills.
- **Rank badge**: A styled numeric badge for the AggRank column that visually emphasizes position (bolder for top ranks).
- **Rating formatting**: Tabular-nums font feature for all numeric columns (already partially applied). AggRating column should be visually emphasized (larger weight or accent color).
- **Data freshness indicator**: A small timestamp + relative time label ("Ran 5 min ago") styled as a muted caption near results.

#### 5. Retrofit Existing Pages

- `/import` (`src/routes/import/+page.svelte`) -- Replace inline Tailwind classes with design-system components (Card, Button, Select, Banner, PageHeader). Wrap in the new page shell layout.
- `/ranking` (`src/routes/ranking/+page.svelte`) -- Same treatment. Apply tier color coding to RankingResultsTable. Wrap in page shell.
- `+layout.svelte` (`src/routes/+layout.svelte`) -- Add the navigation header and page shell here so all routes inherit it.

### Non-Functional Requirements

- **Performance** (Principle 5: Speed Over Aesthetics)
  - No additional JavaScript libraries for styling. CSS custom properties + Tailwind only.
  - No layout shift on page load. Server-rendered HTML must match styled output.
  - Total CSS added by the design system should be under 10 KB gzipped.

- **Accessibility** (WCAG 2.1 AA)
  - All color combinations must meet 4.5:1 contrast ratio minimum for normal text, 3:1 for large text.
  - All interactive elements must have visible focus indicators.
  - Navigation must be fully keyboard-accessible with logical tab order.
  - Data tables must use proper `<thead>`, `<th scope>`, and `<caption>` elements.
  - Buttons must have descriptive accessible names (no icon-only buttons without `aria-label`).

- **Responsive** (Principle 9: Mobile-First Priority)
  - All components must work from 320px to 1440px+ viewport width.
  - Breakpoints: Mobile < 640px, Tablet 640px-1024px, Desktop > 1024px (per standards).
  - Rankings table must remain scannable on mobile -- see responsive behavior details below.
  - Tap targets must be at least 44x44px on touch devices.

- **Maintainability**
  - Every design token must be defined once in `src/app.css` and referenced everywhere else.
  - Components must accept variants via props, not by overriding internal classes.
  - No hardcoded color values in component templates -- all colors reference tokens.

## Visual Design

No mockups. The visual approach is described here for implementation.

### Color Palette (60-30-10 Rule -- Principle 7)

**60% -- Dominant (backgrounds, surfaces, large areas)**

| Token                 | Value     | Usage                                         |
| --------------------- | --------- | --------------------------------------------- |
| `--color-bg`          | `#FAFAFA` | Page background                               |
| `--color-surface`     | `#FFFFFF` | Cards, panels, table backgrounds              |
| `--color-surface-alt` | `#F5F5F5` | Zebra-striped table rows, section backgrounds |

**30% -- Secondary (supporting structure, borders, text)**

| Token                    | Value     | Usage                                       |
| ------------------------ | --------- | ------------------------------------------- |
| `--color-border`         | `#E5E7EB` | Card borders, table dividers, input borders |
| `--color-border-strong`  | `#D1D5DB` | Emphasized borders, active input borders    |
| `--color-text-primary`   | `#111827` | Headings, rank numbers, primary content     |
| `--color-text-secondary` | `#4B5563` | Body text, table cell values                |
| `--color-text-muted`     | `#9CA3AF` | Captions, timestamps, helper text           |

**10% -- Accent (CTAs, emphasis, ranking highlights)**

| Token                  | Value     | Usage                                         |
| ---------------------- | --------- | --------------------------------------------- |
| `--color-accent`       | `#2563EB` | Primary buttons, active nav link, focus rings |
| `--color-accent-hover` | `#1D4ED8` | Primary button hover                          |
| `--color-accent-light` | `#EFF6FF` | Selected states, active backgrounds           |
| `--color-success`      | `#16A34A` | Success banners, "OK" status, import complete |
| `--color-error`        | `#DC2626` | Error banners, validation errors              |
| `--color-warning`      | `#D97706` | Warning banners, unresolved conflicts         |

**Ranking tier colors (background tints, not text colors)**

| Token            | Value         | Usage                                |
| ---------------- | ------------- | ------------------------------------ |
| `--color-tier-1` | `#FEF9C3`     | Ranks 1-5 (warm gold tint)           |
| `--color-tier-2` | `#E0F2FE`     | Ranks 6-15 (cool blue tint)          |
| `--color-tier-3` | `#F0FDF4`     | Ranks 16-30 (light green tint)       |
| `--color-tier-4` | `transparent` | Ranks 31+ (no tint, default surface) |

### Typography Scale (Principle 2: Typography as the Interface)

Use the system font stack for performance. Define a modular scale:

| Token                | Size              | Weight | Line Height | Usage                                                 |
| -------------------- | ----------------- | ------ | ----------- | ----------------------------------------------------- |
| `--text-h1`          | `1.875rem` (30px) | 700    | 1.2         | Page titles ("Rankings", "Import Data")               |
| `--text-h2`          | `1.25rem` (20px)  | 600    | 1.3         | Section headings ("Ranking Settings", "Data Preview") |
| `--text-h3`          | `1.125rem` (18px) | 600    | 1.4         | Card titles, modal titles                             |
| `--text-body`        | `0.875rem` (14px) | 400    | 1.5         | General body text, table cells                        |
| `--text-body-strong` | `0.875rem` (14px) | 600    | 1.5         | Emphasized table cells (team name, AggRating)         |
| `--text-caption`     | `0.75rem` (12px)  | 400    | 1.5         | Timestamps, helper text, column headers               |
| `--text-label`       | `0.875rem` (14px) | 500    | 1.5         | Form labels, nav links                                |
| `--text-stat`        | `1.5rem` (24px)   | 700    | 1.2         | Large stat numbers (import summary counts)            |

System font stack: `'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif`

Note: Inter is optional. If not loaded, the system stack provides a clean fallback. Do not block render for font loading.

### Spacing System

4px base unit, exposed as CSS custom properties:

| Token        | Value            | Typical use                          |
| ------------ | ---------------- | ------------------------------------ |
| `--space-1`  | `0.25rem` (4px)  | Tight padding inside badges          |
| `--space-2`  | `0.5rem` (8px)   | Icon gaps, inline spacing            |
| `--space-3`  | `0.75rem` (12px) | Table cell padding                   |
| `--space-4`  | `1rem` (16px)    | Card padding (mobile), input padding |
| `--space-6`  | `1.5rem` (24px)  | Card padding (desktop), section gaps |
| `--space-8`  | `2rem` (32px)    | Page section spacing                 |
| `--space-12` | `3rem` (48px)    | Page top/bottom padding              |

### Responsive Behavior

**Mobile (< 640px)**

- Navigation collapses to a horizontal scrollable tab bar or hamburger menu.
- Cards stack vertically, full width.
- Rankings table: Hide per-algorithm columns. Show only AggRank, Team Name, AggRating, and W/L Record. Provide a "Show all columns" toggle or horizontal scroll.
- Form selects stack vertically (1 column).
- Buttons become full width within their container.

**Tablet (640px - 1024px)**

- Navigation remains as a horizontal top bar.
- Form selects arranged in 2-column grid.
- Rankings table: Show key columns, allow horizontal scroll for algorithm breakdown.

**Desktop (> 1024px)**

- Full navigation header with all links visible.
- Form selects in 2-3 column grid (as currently implemented).
- Rankings table: All columns visible. Sticky first two columns (Rank, Team Name) on horizontal scroll.

## Reusable Components

### Existing Code to Leverage

The following components and patterns already exist and should be enhanced, not replaced:

| File                                                | What it provides                                                  | Design system action                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/lib/components/RankingResultsTable.svelte`     | Rankings data table with sticky headers, zebra rows, tabular-nums | Add tier color bands, rank badges, responsive column hiding, use design tokens for colors |
| `src/lib/components/FileDropZone.svelte`            | Drag-and-drop file upload with validation                         | Restyle using design tokens. Replace hardcoded blue/red/gray with token references        |
| `src/lib/components/DataPreviewTable.svelte`        | Editable data preview table with error highlighting               | Restyle using design tokens and Card component                                            |
| `src/lib/components/ImportSummary.svelte`           | Stats grid with success banner                                    | Restyle using Card, Banner, and stat token styles                                         |
| `src/lib/components/IdentityResolutionPanel.svelte` | Conflict resolution with dropdowns                                | Restyle using Card, Button, Select, Banner components                                     |
| `src/routes/+layout.svelte`                         | Root layout importing `app.css`                                   | Add navigation header and page shell                                                      |
| `src/app.css`                                       | Tailwind v4 import (`@import 'tailwindcss'`)                      | Add `@theme` block and CSS custom properties before the import                            |

### Existing Patterns to Standardize

These ad-hoc patterns appear repeatedly and should become components:

- **Page container**: `<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">` -- appears in both `/import` and `/ranking`.
- **Page header**: `<h1>` + `<p>` subtitle pattern -- appears in both pages.
- **Settings card**: `rounded-lg border border-gray-200 bg-white p-6 shadow-sm` with heading and form grid -- appears in both pages.
- **Error banner**: Red-bordered alert with icon, heading, message, and retry button -- appears in both pages (identical markup).
- **Primary button**: `bg-blue-600 ... hover:bg-blue-700 ... focus:ring-2 focus:ring-blue-500` -- appears 6+ times across pages.
- **Select field**: Label + styled `<select>` with focus ring -- appears 5 times across both pages.

### New Components Required

| Component                   | Props                                                                                                        | Notes                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `Button.svelte`             | `variant` (primary / secondary / danger / ghost), `size` (sm / md), `disabled`, `loading`, `type`, `onclick` | Replaces all ad-hoc button styles. Loading state includes spinner.                                           |
| `Select.svelte`             | `label`, `id`, `options`, `value` (bindable), `placeholder`, `disabled`, `error`                             | Replaces repeated label + select markup.                                                                     |
| `Card.svelte`               | `children` (snippet), `header` (snippet, optional), `padding` (default / none)                               | Wraps the `rounded-lg border` pattern.                                                                       |
| `Banner.svelte`             | `variant` (success / error / warning / info), `title`, `children` (snippet), `dismissible`                   | Replaces ad-hoc alert banners.                                                                               |
| `PageHeader.svelte`         | `title`, `subtitle`                                                                                          | H1 + subtitle with proper spacing.                                                                           |
| `NavHeader.svelte`          | `currentPath`                                                                                                | Top navigation bar with app logo/title and page links. Highlights active route.                              |
| `PageShell.svelte`          | `children` (snippet)                                                                                         | Wraps NavHeader + Container + main content area. Applied in `+layout.svelte`.                                |
| `DataTable.svelte`          | `children` (snippet), `caption`, `stickyHeader`                                                              | Wrapper providing consistent table chrome (border, scroll, sticky thead). Existing tables compose into this. |
| `RankBadge.svelte`          | `rank`                                                                                                       | Styled numeric rank display. Bolder/larger for top-5, standard for others.                                   |
| `TierRow.svelte`            | `rank`, `children` (snippet)                                                                                 | Table row that applies tier background color based on rank range.                                            |
| `FreshnessIndicator.svelte` | `timestamp` (ISO string)                                                                                     | Displays "Ran 5 min ago" with muted caption styling.                                                         |
| `Spinner.svelte`            | `size` (sm / md)                                                                                             | Reusable loading spinner. Replaces the repeated inline SVG spinner in 3+ places.                             |

All new components live in `src/lib/components/` using PascalCase filenames (per coding style standard).

## Technical Approach

### Design Tokens: CSS Custom Properties + Tailwind v4 `@theme`

All tokens are defined in `src/app.css`. Structure:

```
/* 1. CSS custom properties (the source of truth) */
:root {
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
  /* ... all tokens ... */
}

/* 2. Tailwind v4 theme mapping */
@theme {
  --color-bg: var(--color-bg);
  --color-surface: var(--color-surface);
  /* ... maps tokens to Tailwind utilities ... */
}

/* 3. Tailwind base import */
@import 'tailwindcss';
```

This approach gives:

- Direct CSS variable access for any custom styling or computed values.
- Tailwind utility classes like `bg-surface`, `text-accent`, `border-border` for template usage.
- A single file to update when evolving the palette.

### Layout: Page Shell, Container, Grid

- `PageShell.svelte` wraps `+layout.svelte` children in: NavHeader at top, then a `<main>` with the container pattern.
- Container uses `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` (matching existing pages).
- Grid layouts use Tailwind's built-in `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` patterns (no custom grid system needed).

### Components: Svelte 5 + Tailwind

- All components use Svelte 5 runes (`$props`, `$state`, `$derived`).
- Props are typed with TypeScript.
- Variants are implemented via conditional Tailwind classes, selected by a `variant` prop.
- No `class` prop forwarding unless explicitly needed (prefer controlled variants to avoid style leaks).
- Components use Svelte 5 snippets (`{#snippet}` / `{@render}`) for composable children and slots.

### Testing

- **Accessibility audit**: Each component must pass `axe-core` automated checks when rendered in test.
- **Snapshot tests**: Snapshot each component variant (Button primary, Button secondary, etc.) to catch unintended visual regressions. Use Vitest with `@testing-library/svelte`.
- **Responsive spot checks**: Manual testing checklist for 320px, 768px, and 1280px widths on the `/import` and `/ranking` pages.
- **Contrast verification**: Verify all token color pairings meet WCAG AA contrast ratios. Document pairings in a test or comment.

## Out of Scope

- **Dark mode** -- Light mode only in this iteration. Token naming is dark-mode-ready (semantic names, not color-literal names) to make future addition straightforward.
- **Figma design files** -- Design system is defined in code only.
- **Complex data visualizations** -- Sparklines, charts, algorithm contribution bar segments are deferred to Feature 6 (Rankings Dashboard).
- **Animation or transition system** -- No defined motion tokens or transition patterns. Existing `transition-colors duration-200` on hover states is acceptable.
- **Icon library** -- Continue using inline SVGs as-is. A consolidated icon system can be added later.
- **Theming / white-labeling** -- Single theme only. No theme switcher.

## Success Criteria

- [ ] All design tokens (color, typography, spacing) are defined as CSS custom properties in `src/app.css` and mapped in a Tailwind v4 `@theme` block.
- [ ] No hardcoded color hex values remain in any `.svelte` component template -- all reference tokens or Tailwind theme classes.
- [ ] The `/import` page renders identically to its current appearance (or better) using the new design-system components.
- [ ] The `/ranking` page renders identically to its current appearance (or better) using the new design-system components, with the addition of tier color bands.
- [ ] A persistent navigation header appears on all pages, with the active route highlighted.
- [ ] All new components pass `axe-core` automated accessibility checks (zero violations).
- [ ] All text/background color pairings meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text).
- [ ] The rankings table is usable on a 375px-wide viewport (key columns visible, horizontal scroll or column toggle for the rest).
- [ ] Each new component has at least one Vitest snapshot test per variant.
- [ ] Total CSS footprint added by the design system is under 10 KB gzipped.
