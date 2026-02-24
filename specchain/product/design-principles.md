# Design Principles: Clarity → Trust → Action

Source: "How I Use 10 Essential UI/UX Design Principles to Boost Conversions in 2026" by Dolly Borade Solanki

Design is a business strategy. Users scan and decide in seconds. Performance and structure are more critical than aesthetics.

## The 10 Principles

### 1. Clear Visual Hierarchy

Define structure before aesthetics. One strong H1, a value-clarifying subheading, a primary CTA, and supporting proof. Users must immediately understand the offering.

### 2. Typography as the Interface

95% of web content is text. Use a modular type scale, high contrast, proper line height, and intentional spacing to build trust and readability.

### 3. Friction Removal

Simplify every step. Short forms, smart autofill, clear labels, minimal steps. Prevent user drop-off by removing unnecessary decisions.

### 4. Designing for Scanning Behavior

Align layouts with F-pattern or Z-pattern reading habits. Critical content top-left, bullet points, highlighted key phrases.

### 5. Speed Over Aesthetics

Performance is a feature. Lightweight layouts, optimized assets. Slow load times increase bounce rates.

### 6. Trust Through Micro-Details

Reduce hesitation with real data, transparent information, clear indicators of reliability. For this project: show algorithm sources, data freshness timestamps, computation transparency.

### 7. Strategic Color Psychology (60-30-10 Rule)

- 60% dominant (background/surface)
- 30% secondary (cards, sections, supporting elements)
- 10% accent/CTA (action points, highlights, rankings emphasis)

### 8. Purposeful CTAs

Every section provides direction. Action-based copy, high contrast, whitespace. No generic "Submit" buttons.

### 9. Mobile-First Priority

Thumb-friendly button placement, large tap targets, simplified navigation. Committee members may review rankings on phones.

### 10. Continuous Optimization

Data-driven refinement through usage patterns. Track which views committee members use most, which data they drill into.

## Application to This Project

**Clarity**: Rankings dashboard must communicate team position, trend, and algorithmic basis at a glance. No hunting for information.

**Trust**: Show exactly how each algorithm contributed to a ranking. Transparent weights, visible data sources, timestamps on snapshots.

**Action**: Every view guides the committee toward their next task -- review this team, approve this seeding, export this report.

### Dashboard-Specific Applications

- **Visual hierarchy**: AggRank and AggRating are the H1. Per-algorithm breakdown is supporting detail.
- **Scanning**: Rankings table designed for vertical scanning. Key columns (rank, team, rating, record) visible without horizontal scroll.
- **Friction removal**: File upload is drag-and-drop, algorithm runs are one-click, exports are immediate.
- **Speed**: Server-side rendering for initial table load. No client-side computation for display.
- **Trust**: Every number links to its source data. "How was this calculated?" is always one click away.
