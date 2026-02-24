# Volleyball Ranking Engine -- Business Rules Index

> Last updated: 2026-02-24

This section documents every business rule that governs how the Volleyball Ranking Engine works. Each page is written for AAU volleyball committee members, administrators, and stakeholders who need to understand the system's behavior without technical jargon.

## What This System Does

The Volleyball Ranking Engine computes, reviews, and publishes team rankings for AAU volleyball across four age groups (15U, 16U, 17U, 18U). It uses a five-algorithm ensemble approach to produce defensible, transparent rankings that withstand scrutiny from coaches, parents, and tournament directors.

## Business Domains

| Domain               | Description                                                                  | Link                                               |
| -------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Ranking System       | How team rankings are computed, normalized, aggregated, and finalized        | [Ranking Rules](business-rules/ranking.md)         |
| Data Import          | How tournament results and pre-computed ratings are uploaded into the system | [Data Import Rules](business-rules/data-import.md) |
| Export and Reporting | How rankings are exported as CSV, Excel, and PDF documents                   | [Export Rules](business-rules/export.md)           |

## Key Concepts

### Age Groups

The system operates independently for each of four age groups:

- **15U** -- 15 and under
- **16U** -- 16 and under
- **17U** -- 17 and under
- **18U** -- 18 and under

Each ranking run produces results for exactly one age group. Rankings from different age groups never intermingle.

### Seasons

All tournament data and ranking runs are scoped to a season (e.g., "2025-2026 Season"). A season defines the time window of tournaments whose results feed into rankings.

### The Five Algorithms

Rankings are not produced by a single formula. Instead, five independent algorithms each produce their own ranking, and the final ranking is the average of all five:

1. **Colley Matrix** -- A mathematical method that considers every team's full body of work simultaneously, without regard to when games were played.
2. **Elo Variant A** (starting at 2200) -- A sequential rating system that processes tournament results in date order.
3. **Elo Variant B** (starting at 2400) -- Same approach, different starting point.
4. **Elo Variant C** (starting at 2500) -- Same approach, different starting point.
5. **Elo Variant D** (starting at 2700) -- Same approach, different starting point.

Using five algorithms with different methodologies and parameters reduces the chance of any single formula's quirks unfairly affecting a team's ranking.

### Tournament Weights

Not all tournaments carry equal importance. The committee assigns a weight (multiplier) and tier to each tournament. Higher-weight tournaments have a greater influence on final rankings. Tier-1 tournaments (the most prestigious) also contribute to seeding reference data.

### Committee Overrides

After rankings are computed algorithmically, the committee may adjust individual team positions. Every override requires a written justification and the name of the committee member who made the change. The original algorithmic rank is always preserved for transparency.

### Ranking Run Lifecycle

A ranking run moves through two states:

1. **Draft** -- Rankings have been computed but can still be adjusted (overrides added or removed, re-run possible).
2. **Finalized** -- Rankings are locked and can no longer be modified.

## How to Read These Documents

Each business rule document uses a consistent format:

- **When/Then statements** describe system behavior in plain language
- **Examples** use realistic team names and numbers
- **Diagrams** illustrate workflows and state transitions
- **Tables** summarize reference data such as default values and valid ranges
