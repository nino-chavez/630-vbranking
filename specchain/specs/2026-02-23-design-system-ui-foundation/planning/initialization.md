# Feature 5: Design System & UI Foundation

Design System & UI Foundation -- Define the visual design system following the Clarity → Trust → Action framework (see specchain/product/design-principles.md). Establish color palette (60-30-10 rule), typography scale, spacing system, component patterns, and information architecture. This includes layout primitives, data table styling, card patterns, and the visual language for ranking data (color-coded tiers, sparklines, algorithm contribution indicators). Must be defined before any UI implementation.

## Key Input: Design Principles (Clarity → Trust → Action)

Source: `specchain/product/design-principles.md`

This spec is governed by 10 design principles distilled from the Clarity → Trust → Action framework:

1. **Clear Visual Hierarchy** -- One strong H1, value-clarifying subheading, primary CTA, supporting proof. Users must immediately understand the offering.
2. **Typography as the Interface** -- Modular type scale, high contrast, proper line height, intentional spacing. 95% of web content is text.
3. **Friction Removal** -- Short forms, smart autofill, clear labels, minimal steps. Remove unnecessary decisions.
4. **Designing for Scanning Behavior** -- F-pattern/Z-pattern layouts. Critical content top-left, bullet points, highlighted key phrases.
5. **Speed Over Aesthetics** -- Lightweight layouts, optimized assets. Performance is a feature.
6. **Trust Through Micro-Details** -- Show algorithm sources, data freshness timestamps, computation transparency. Reduce hesitation with real data.
7. **Strategic Color Psychology (60-30-10 Rule)** -- 60% dominant (background/surface), 30% secondary (cards, sections), 10% accent/CTA (action points, rankings emphasis).
8. **Purposeful CTAs** -- Action-based copy, high contrast, whitespace. No generic buttons.
9. **Mobile-First Priority** -- Thumb-friendly placement, large tap targets, simplified navigation.
10. **Continuous Optimization** -- Data-driven refinement through usage patterns.

### Dashboard-Specific Applications

- **Visual hierarchy**: AggRank and AggRating are the H1. Per-algorithm breakdown is supporting detail.
- **Scanning**: Rankings table designed for vertical scanning. Key columns (rank, team, rating, record) visible without horizontal scroll.
- **Friction removal**: File upload is drag-and-drop, algorithm runs are one-click, exports are immediate.
- **Speed**: Server-side rendering for initial table load. No client-side computation for display.
- **Trust**: Every number links to its source data. "How was this calculated?" is always one click away.

### Project-Level Application

- **Clarity**: Rankings dashboard must communicate team position, trend, and algorithmic basis at a glance.
- **Trust**: Show exactly how each algorithm contributed to a ranking. Transparent weights, visible data sources, timestamps on snapshots.
- **Action**: Every view guides the committee toward their next task -- review this team, approve this seeding, export this report.

## Scope of This Spec

This spec must define, before any UI implementation begins:

- **Color palette**: Following the 60-30-10 rule. Dominant, secondary, and accent colors with semantic meaning for ranking tiers.
- **Typography scale**: Modular scale for headings, body, captions, and data-dense tables.
- **Spacing system**: Consistent spacing tokens for layout, padding, margins.
- **Component patterns**: Buttons, inputs, cards, tables, modals, navigation.
- **Information architecture**: Page layouts, navigation structure, content hierarchy.
- **Layout primitives**: Grid system, container widths, responsive breakpoints.
- **Data table styling**: Column alignment, row density, sortable headers, pagination.
- **Card patterns**: Team summary cards, algorithm breakdown cards, snapshot cards.
- **Ranking visual language**: Color-coded tiers, sparklines for trend, algorithm contribution indicators (weights, bar segments).
