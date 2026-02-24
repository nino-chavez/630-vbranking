# Requirements: Design System & UI Foundation

## Pre-Established Decisions

These decisions are already documented in `specchain/product/design-principles.md` and the roadmap:

- **Framework**: Clarity → Trust → Action (10 design principles)
- **Color strategy**: 60-30-10 rule (dominant/secondary/accent)
- **Typography**: Modular type scale, high contrast, proper line height
- **Target users**: Ranking committee members reviewing data-dense tables on desktop and mobile
- **Tech stack**: SvelteKit + Tailwind CSS v4 (already installed and configured)
- **No Figma**: Design system defined in code (Tailwind theme + CSS custom properties), not in a design tool
- **Scope**: Tokens, layout primitives, component patterns, data table styling, ranking visual language

## Clarifying Questions & Answers

### Q1: Should the design system be implemented as Tailwind CSS theme configuration, CSS custom properties, or both?

**A**: Both. Define semantic design tokens as CSS custom properties in `src/app.css` (e.g., `--color-surface`, `--color-accent`), and extend the Tailwind theme via `@theme` in Tailwind v4 to map those tokens to utility classes. This gives us both programmatic access and Tailwind utility convenience.

### Q2: Should the design system include a dark mode variant?

**A**: Not in this iteration. Light mode only. The committee dashboard is used in well-lit environments (offices, gyms). Dark mode can be added later.

## Scope Summary

This spec defines:

1. **Design tokens**: Color palette, typography scale, spacing system as CSS custom properties
2. **Tailwind theme extension**: Map tokens into Tailwind v4's `@theme` system
3. **Layout primitives**: Page shell, container, grid, responsive breakpoints
4. **Component patterns**: Buttons, inputs/selects, cards, data tables, banners, navigation
5. **Ranking visual language**: Tier color coding, rating formatting, rank badges
6. **Apply to existing pages**: Retrofit the import page (`/import`) and ranking page (`/ranking`) with the new design system
7. **Information architecture**: Navigation structure, page hierarchy

This spec does NOT include:

- Dark mode
- Figma design files
- Complex data visualizations (sparklines, charts) — deferred to Feature 6
- Animation or transition systems
- Icon library selection
