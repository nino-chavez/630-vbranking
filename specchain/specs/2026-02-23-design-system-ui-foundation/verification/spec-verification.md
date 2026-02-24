# Specification Verification Report

## Verification Summary

- **Overall Status**: ⚠️ Issues Found
- **Date**: 2026-02-23
- **Spec**: Feature 5: Design System & UI Foundation
- **Depth**: standard (confirmed from execution-profile.yml)
- **Strategy**: squad (confirmed)
- **Reusability Check**: ✅ Passed
- **Test Writing Limits**: ✅ Compliant
- **Pure Frontend**: ✅ Confirmed — no database or API tasks present

---

## Structural Verification (Checks 1-2)

### Check 1: Requirements Accuracy

The two Q&A answers from requirements gathering are:

**Q1: CSS custom properties vs Tailwind theme → Both**

- ✅ Accurately captured: requirements.md states "Both. Define semantic design tokens as CSS custom properties in `src/app.css`... and extend the Tailwind theme via `@theme` in Tailwind v4". This is fully reflected in spec.md's Technical Approach section and in Task Group 1.

**Q2: Dark mode → No, light only**

- ✅ Accurately captured: requirements.md states "Not in this iteration. Light mode only." The spec.md Out of Scope section explicitly lists "Dark mode — Light mode only in this iteration." Tasks contain no dark mode work.

**Pre-established decisions:**

- ✅ 60-30-10 color rule: captured and expanded in spec.md Color Palette section with exact token values.
- ✅ SvelteKit + Tailwind CSS v4: reflected in all task group headers and tech stack line.
- ✅ No Figma: spec.md confirms "No mockups. The visual approach is described here for implementation."
- ✅ Scope (tokens, layout primitives, component patterns, data table styling, ranking visual language): all five areas are addressed as Core Requirements sections 1-5.
- ✅ Retrofit existing pages (`/import`, `/ranking`): captured in requirements.md scope item 6 and spec.md section 5.
- ✅ Information architecture: captured in requirements.md scope item 7.

**Reusability opportunities:**

- ✅ requirements.md does not list external reusability paths (no similar prior feature pointed to). The spec itself identifies the existing components to leverage in the "Reusable Components" section. This is correct for a greenfield design system.

**Assessment**: All Q&A answers accurately and completely captured. No misrepresentations found.

### Check 2: Visual Assets

Visual assets directory exists at `specchain/specs/2026-02-23-design-system-ui-foundation/planning/visuals/` but is **empty** (directory created, no files present).

- ✅ No visual files present — this is expected and correct. requirements.md states "No Figma: Design system defined in code." spec.md confirms "No mockups."
- ✅ The empty visuals directory is not a problem — it is consistent with the code-only design system approach.

Check 3 (Visual Design Tracking) is skipped — no visual assets to analyze.

---

## Content Validation (Checks 3-7)

### Check 3: Visual Design Tracking

Skipped — no visual assets exist. This is the correct and expected state for this feature.

### Check 4: Requirements Coverage

**Explicit features requested (from requirements.md Scope Summary):**

1. Design tokens (CSS custom properties): ✅ Covered in spec.md section 1 and Task Group 1 with full token tables.
2. Tailwind theme extension (`@theme`): ✅ Covered in spec.md Technical Approach and task 1.5.
3. Layout primitives (page shell, container, grid, breakpoints): ✅ Covered in spec.md section 2 and tasks 2.8, 2.9, 3.2.
4. Component patterns (Buttons, inputs/selects, cards, data tables, banners, navigation): ✅ Covered in spec.md section 3 with all 7 component types specified. Task Group 2 creates 12 components.
5. Ranking visual language (tier color coding, rating formatting, rank badges): ✅ Covered in spec.md section 4 with specific tokens and components.
6. Apply to existing pages (`/import`, `/ranking`): ✅ Covered in spec.md section 5 and Task Group 3 (tasks 3.2–3.7).
7. Information architecture (navigation structure, page hierarchy): ✅ Covered via NavHeader and PageShell components.

**Constraints stated:**

- ✅ No JavaScript libraries for styling (only CSS + Tailwind): reflected in spec.md Non-Functional Requirements.
- ✅ WCAG 2.1 AA contrast (4.5:1): reflected in spec.md and task 4.3.
- ✅ CSS under 10 KB gzipped: reflected in spec.md Non-Functional Requirements.
- ✅ 4px base spacing unit: reflected in spec.md Spacing System.
- ✅ Svelte 5 runes (no legacy `export let`): reflected in spec.md Technical Approach and task group 2 acceptance criteria.
- ✅ Svelte 5 snippets (no `<slot>`): reflected in spec.md Technical Approach and task group 2 acceptance criteria.
- ✅ Mobile breakpoints per standards (< 640px, 640–1024px, > 1024px): matches responsive.md exactly.

**Out-of-scope items (correctly excluded):**

- ✅ Dark mode: excluded in spec.md Out of Scope.
- ✅ Figma design files: excluded.
- ✅ Complex data visualizations (sparklines, charts): excluded, deferred to Feature 6.
- ✅ Animation/transition system: excluded.
- ✅ Icon library: excluded.
- ✅ Theming/white-labeling: excluded (added in spec, reasonable extension of "no Figma" and "single iteration" scope).

**Reusability opportunities:**

- ✅ spec.md "Reusable Components" section explicitly lists 7 existing files to leverage with specific design system actions.
- ✅ spec.md "Existing Patterns to Standardize" lists 6 ad-hoc patterns that become components.
- ✅ tasks.md Summary table identifies all modified existing assets with specific actions.

**Implicit needs addressed:**

- ✅ `tabular-nums` for numeric columns (identified from existing `RankingResultsTable` code, preserved in spec).
- ✅ `<th scope="col">` for accessibility in table headers (not stated in requirements but correct and included).
- ✅ `aria-current="page"` on active nav link (not stated in requirements, correct addition).

### Check 5: Core Specification Issues

**Goal**: "Establish a cohesive visual design system... so that the existing `/import` and `/ranking` pages and all future UI are built from a single, consistent, maintainable foundation."

- ✅ Directly addresses the feature description. Aligns with Clarity → Trust → Action framework.

**User Stories**: 6 stories covering committee member scanning, tier color coding, cohesive application feel, mobile usability, data freshness, and navigation.

- ✅ All stories are directly traceable to requirements. The "data freshness indicator" story links to Trust (Principle 6). The mobile story links to Principle 9.
- ✅ No fabricated user stories found.

**Core Requirements sections 1–5**: Each maps cleanly to a requirements.md scope item.

- ✅ Section 1 (Design Tokens) = scope item 1+2.
- ✅ Section 2 (Layout Primitives) = scope item 3.
- ✅ Section 3 (Component Patterns) = scope item 4.
- ✅ Section 4 (Ranking Visual Language) = scope item 5.
- ✅ Section 5 (Retrofit Existing Pages) = scope item 6.
- ✅ Non-functional requirements (performance, accessibility, responsive, maintainability) are consistent with design-principles.md and the standards files.

**Out of Scope section**: All 6 items match requirements.md and no in-scope items are incorrectly excluded.

**Reusability notes**: spec.md includes a dedicated "Reusable Components" section.

- ✅ All 5 existing components (`RankingResultsTable`, `FileDropZone`, `DataPreviewTable`, `ImportSummary`, `IdentityResolutionPanel`) and 2 layout files (`+layout.svelte`, `app.css`) are explicitly listed with specific actions.

**Issue — `--text-body-strong` token missing from task 1.3**:

- spec.md typography table defines `--text-body-strong: 0.875rem / 600 weight` as a distinct token.
- Task 1.3 lists font-size tokens but does NOT include `--text-body-strong`.
- The test in task 1.1 checks for `--text-h1` through `--text-stat` — this wording is ambiguous about whether `--text-body-strong` is included.
- Minor issue: the `--text-body-strong` token should be explicitly included in task 1.3's implementation checklist and test 3's assertion.

**Issue — Banner component uses hardcoded Tailwind color classes**:

- Task 2.6 specifies `bg-green-50`, `bg-red-50`, `bg-amber-50` for Banner variants — these are hardcoded Tailwind color utilities, not design token references.
- spec.md success criterion states "No hardcoded color hex values remain in any `.svelte` component template — all reference tokens or Tailwind theme classes."
- While these are Tailwind classes (not hex values), `bg-green-50` and `bg-red-50` are not mapped design tokens. `bg-accent-light` and `bg-error` variants of these colors exist in the token system but the green/amber equivalents are not tokenized.
- Minor inconsistency: either the spec should add `--color-success-light` and `--color-warning-light` tokens, or the Banner task should clarify this exception.

### Check 6: Task List Issues

**Test Writing Limits:**

- ✅ Task Group 1: Specifies exactly 3 focused tests (within 2-8 range). Task 1.6 runs ONLY the 3 tests written in 1.1.
- ✅ Task Group 2: Specifies exactly 8 focused tests (at the 2-8 maximum). Task 2.14 runs ONLY the 8 tests written in 2.1.
- ✅ Task Group 3: Specifies exactly 5 focused tests (within 2-8 range). Task 3.8 runs ONLY the 5 tests written in 3.1.
- ✅ Task Group 4 (testing-engineer): Adds exactly 10 tests (4 accessibility + 2 contrast + 4 edge cases = 10, at the maximum). Does not exceed the 10-test limit.
- ✅ Task 4.5 runs the complete feature test suite as a final gate — this is appropriate for the testing-engineer's final subtask (not an implementation group running the full suite).
- ✅ Total tests: 3 + 8 + 5 + 10 = 26. Within the expected range of 16-34.

**Reusability References:**

- ✅ Task 2.2 (Spinner): "Replaces the repeated inline SVG spinner pattern found in 3+ places."
- ✅ Task 2.3 (Button): "Replaces all ad-hoc button styles."
- ✅ Task 2.4 (Select): "Replace the repeated label+select markup found 5+ times."
- ✅ Task 2.5 (Card): "Replaces the repeated `rounded-lg border border-gray-200 bg-white p-6 shadow-sm` pattern."
- ✅ Task 2.7 (PageHeader): "Replaces the repeated `<h1>` + `<p>` pattern."
- ✅ Task 3.5: "Import `TierRow`, `RankBadge`, and `DataTable` components" — references are to components created in Group 2.
- ✅ Task 3.7: Explicitly lists all 4 existing components to modify with specific color replacement mappings.
- ✅ All new component tasks reference their purpose and what they replace from the existing codebase.

**Task Specificity:**

- ✅ All tasks reference specific files (`src/app.css`, `src/lib/components/Button.svelte`, etc.) with exact prop names, class values, and hex codes.
- ✅ Test tasks specify exact assertion language and test scenarios.
- No vague tasks identified.

**Traceability:**

- ✅ Task Group 1 → spec.md section 1 (Design Tokens).
- ✅ Task Group 2 → spec.md section 3 (Component Patterns) and "New Components Required" table.
- ✅ Task Group 3 → spec.md section 5 (Retrofit Existing Pages) and "Responsive Behavior."
- ✅ Task Group 4 → spec.md Testing section and Non-Functional Requirements (accessibility, WCAG).

**Scope — no tasks for unrequested features:**

- ✅ No dark mode tasks.
- ✅ No sparkline or chart tasks.
- ✅ No animation system tasks.
- ✅ No icon library tasks.
- ✅ No backend/API/database tasks — confirmed purely frontend.

**Task Count per Group:**

| Group                      | Task Count | Status                 |
| -------------------------- | ---------- | ---------------------- |
| Group 1: Design Tokens     | 6          | ✅ Within 3-10         |
| Group 2: Component Library | 14         | ⚠️ Exceeds limit of 10 |
| Group 3: Page Retrofitting | 8          | ✅ Within 3-10         |
| Group 4: Test Review       | 5          | ✅ Within 3-10         |

**Issue — Task Group 2 has 14 sub-tasks (exceeds the 3-10 guideline)**:

- Group 2 contains one test-writing task (2.1), one verification task (2.14), and 12 component implementation tasks (2.2–2.13) — one per new component.
- The 12-component count is directly driven by spec requirements; each component is distinct and justified.
- This is a structural over-count in one group, not over-engineering. However, it does violate the 3-10 task guideline.
- Recommendation: Group 2 could be split into "Group 2a: Core UI Components" (Button, Select, Card, Banner, PageHeader, Spinner) and "Group 2b: Layout & Ranking Components" (NavHeader, PageShell, DataTable, RankBadge, TierRow, FreshnessIndicator). Both would have 6-8 tasks each.

**Squad Strategy Alignment:**

- ⚠️ The execution-profile.yml defines domain specialists: `design_system_engineer`, `layout_engineer`, `component_engineer`, `data_viz_engineer`. However, tasks.md assigns all Groups 1-3 to a single `ui-designer` implementer. This collapses the squad structure into a single-agent workflow.
- All Groups 1-3 could reasonably be assigned to `ui-designer` as a general frontend implementer, but the squad strategy's intent was to parallelize across domain specialists. The tasks as written imply sequential execution (Group 1 → 2 → 3) rather than parallel squad work.
- Minor concern: the execution profile's domain split (design_system_engineer, layout_engineer, component_engineer, data_viz_engineer) is not reflected in the task group assignments.

### Check 7: Reusability and Over-Engineering

**Unnecessary new components:**

- ✅ All 12 new components are justified: each replaces an identified repeated pattern or adds a new capability (tier coloring, freshness display, rank badge). No existing component covers these needs.
- ✅ The spec explicitly explains what each component replaces and why.

**Duplicated logic:**

- ✅ FreshnessIndicator implements a simple relative-time function without an external library (Principle 5: Speed Over Aesthetics). This is correct and justified.
- ✅ No business logic duplication — this is a purely presentational layer.

**Missing reuse opportunities:**

- ✅ All 5 existing Svelte components are identified for enhancement, not replacement.
- ✅ The existing container pattern (`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8`) is extracted to PageShell rather than duplicated.
- ✅ The existing `tabular-nums` pattern in `RankingResultsTable` is preserved and extended.

**Justification for new code:**

- ✅ Every new component has a clear "replaces N instances of X" justification in both spec.md and tasks.md.

**Standards compliance review:**

| Standard                                      | Spec/Tasks Alignment                                                       | Status |
| --------------------------------------------- | -------------------------------------------------------------------------- | ------ |
| `css.md`: utility-first, CSS variables        | ✅ Tailwind utilities + CSS custom properties                              | ✅     |
| `css.md`: avoid inline styles                 | ✅ All styles via Tailwind classes                                         | ✅     |
| `components.md`: one component per file       | ✅ Each component in its own `.svelte` file                                | ✅     |
| `components.md`: explicit prop types          | ✅ TypeScript props required by spec and tasks                             | ✅     |
| `components.md`: composition over inheritance | ✅ Snippets for composability                                              | ✅     |
| `responsive.md`: mobile-first                 | ✅ Mobile breakpoints < 640px with `sm:` prefixes                          | ✅     |
| `responsive.md`: breakpoints match standard   | ✅ Mobile < 640px, Tablet 640-1024px, Desktop > 1024px                     | ✅     |
| `accessibility.md`: WCAG 2.1 AA               | ✅ 4.5:1 contrast, keyboard nav, ARIA                                      | ✅     |
| `accessibility.md`: semantic HTML             | ✅ `<nav>`, `<main>`, `<caption>`, `<thead>`, `<th scope>`                 | ✅     |
| `coding-style.md`: TypeScript strict          | ✅ Typed props required                                                    | ✅     |
| `coding-style.md`: kebab-case for file names  | ⚠️ CONFLICT — spec requires PascalCase for component files                 | ⚠️     |
| `coding-style.md`: camelCase variables        | ✅ Prop names use camelCase                                                | ✅     |
| `coding-style.md`: PascalCase for components  | ✅ Component names are PascalCase                                          | ✅     |
| `conventions.md`: absolute imports preferred  | ✅ `$lib/components/` path alias used                                      | ✅     |
| `commenting.md`: comment "why" not "what"     | ✅ Tasks include contextual notes but no excessive commenting instructions | ✅     |
| `error-handling.md`: friendly error messages  | ✅ Banner component handles user-facing errors                             | ✅     |
| `validation.md`: type safety, avoid `any`     | ✅ TypeScript types required throughout                                    | ✅     |
| `tech-stack.md`: Vitest for unit tests        | ✅ All tests use Vitest + @testing-library/svelte                          | ✅     |
| `test-writing.md`: AAA pattern                | ✅ Tests follow Arrange-Act-Assert                                         | ✅     |
| `test-writing.md`: independent tests          | ✅ `cleanup()` after each test required                                    | ✅     |

---

## Critical Issues

**None identified that block implementation.** The spec and tasks are fundamentally sound and implementation-ready.

---

## Minor Issues

1. **`--text-body-strong` token missing from task 1.3**: spec.md defines `--text-body-strong` in the typography table, but task 1.3 does not list it in the tokens to define. The test in task 1.1 checks for `--text-h1` through `--text-stat` — this wording is ambiguous whether `--text-body-strong` is included. Task 1.3 should be updated to explicitly include `--text-body-strong: 0.875rem` in the font-size token list, with a corresponding `--font-body-strong: 600` (or note it uses `--font-semibold`).

2. **Banner component uses non-tokenized Tailwind color classes**: Task 2.6 uses `bg-green-50`, `bg-red-50`, `bg-amber-50` for Banner variants. These are not mapped design tokens. While the spec's "no hardcoded hex values" criterion is technically met (these are Tailwind utility classes, not hex values), they bypass the token system. Either add `--color-success-bg`, `--color-error-bg`, `--color-warning-bg` tokens to the palette, or acknowledge this as an acceptable exception.

3. **Task Group 2 has 14 sub-tasks, exceeding the 3-10 guideline**: This is driven by the 12-component requirement. Consider splitting Group 2 into two groups: "Core UI Components" (Button, Select, Card, Banner, PageHeader, Spinner) and "Layout & Ranking Components" (NavHeader, PageShell, DataTable, RankBadge, TierRow, FreshnessIndicator). This would yield two groups of ~8 tasks each, both compliant with the guideline.

4. **Squad strategy not reflected in task assignments**: The execution profile defines 4 domain specialists (design_system_engineer, layout_engineer, component_engineer, data_viz_engineer) but tasks.md assigns all Groups 1-3 to `ui-designer`. This is workable but loses the parallelization benefit of the squad strategy. If squad execution is intended, consider assigning Groups 1/2a to `design_system_engineer`+`component_engineer` and Group 3 layout work to `layout_engineer`.

5. **Tier-4 row loses zebra striping**: Task 3.5 notes that "tier colors replace zebra striping for ranked rows." For rank 31+ rows (tier-4, transparent), both the tier color and zebra striping are absent — these rows will have a plain white background. This is visually valid but should be explicitly confirmed in the spec's "Responsive Behavior" or "Ranking Visual Language" section to avoid confusion during implementation.

6. **Test 7 in task 4.4 has a grammatical issue in expected output**: The test expects "1 hours ago" for a 90-minute timestamp. The FreshnessIndicator function as specified in task 2.13 uses "X hours ago" format, which would produce "1 hours ago" — this is grammatically incorrect. The implementation should handle the singular "1 hour ago" vs. plural "X hours ago" cases. Both the component spec in task 2.13 and the test expectation in task 4.4 should reflect this.

7. **`$page` import approach for SvelteKit Svelte 5**: Task 3.2 mentions two approaches: "`$app/stores` or `$page.url.pathname` (Svelte 5 way)". In SvelteKit with Svelte 5, the preferred approach is `import { page } from '$app/state'` (introduced in SvelteKit 2.12+), not `$app/stores`. The task's parenthetical "(Svelte 5 way)" hints at this but doesn't commit to the correct module. This should specify `$app/state` explicitly to avoid using the deprecated store pattern.

---

## Over-Engineering Concerns

None identified. The component count (12 new components) is justified by the number of existing patterns being standardized. The token system is appropriately sized. No unnecessary complexity was added.

---

## Recommendations

1. **Add `--text-body-strong` explicitly to task 1.3** and update test 3 in task 1.1 to assert its presence.

2. **Clarify Banner color exception**: Either add three new tokens (`--color-success-bg: #F0FDF4`, `--color-error-bg: #FEF2F2`, `--color-warning-bg: #FFFBEB`) to the color palette in spec.md and task 1.2, or add a note to task 2.6 explicitly acknowledging that Banner uses Tailwind semantic colors for alert backgrounds as an intentional design choice.

3. **Split Task Group 2 into two groups** to comply with the 3-10 tasks-per-group guideline: "Group 2a: Core UI Components" and "Group 2b: Layout & Ranking Components." Update dependency chains accordingly.

4. **Fix the `FreshnessIndicator` pluralization**: Update task 2.13's function spec to handle "1 hour ago" (singular) vs. "X hours ago" (plural). Update task 4.4 test 7 to expect "1 hour ago" for 90-minute timestamps.

5. **Specify `$app/state` for SvelteKit Svelte 5**: Update task 3.2 to explicitly use `import { page } from '$app/state'` instead of the ambiguous `$app/stores` reference.

6. **Resolve the file naming conflict**: `coding-style.md` mandates `kebab-case` for file names, but the entire Svelte component ecosystem of this project uses `PascalCase` (all 5 existing components are PascalCase). The project convention overrides the generic standard. Either update `coding-style.md` to note the Svelte exception ("PascalCase for Svelte component files"), or note in tasks.md that PascalCase is the project's established Svelte convention. This is not a blocker for implementation since the existing codebase already uses PascalCase consistently.

---

## Conclusion

The Feature 5: Design System & UI Foundation specification is **well-structured, requirements-accurate, and implementation-ready**. The spec correctly reflects both Q&A answers, enforces the Clarity → Trust → Action framework, excludes all out-of-scope items, and provides exhaustive detail for each component and token.

Test writing limits are fully compliant: 3 + 8 + 5 = 16 tests in implementation groups (all within 2-8 each), plus 10 testing-engineer tests, totaling 26 — within the expected 16-34 range.

No critical issues were found. The seven minor issues identified are all fixable with targeted edits and do not require re-scoping or re-architecting the feature. The most actionable fixes are: adding `--text-body-strong` to task 1.3, clarifying the Banner color tokens, splitting Group 2, and fixing the `FreshnessIndicator` pluralization bug before implementation.

**Ready for implementation with minor pre-implementation fixes recommended.**
