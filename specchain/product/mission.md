# Product Mission

## Pitch

**Volleyball Ranking Engine** is a data-driven ranking and seeding platform that helps AAU Boys' Youth Volleyball seeding committees replace fragile, manually-maintained spreadsheets with an automated, transparent, and extensible system by ingesting match results, running multiple mathematical rating models, and producing unified rankings aligned with official AAU Seeding Guidelines.

## Users

### Primary Customers

- **AAU Seeding Committee Members** (6 people): Responsible for ingesting data, running algorithms, reviewing rankings, and applying subjective adjustments before publishing official seedings.
- **Club Directors & Coaches**: Want transparency into how their teams are ranked and seeded for major events so they can understand and, if needed, appeal their position.
- **Tournament Organizers**: Need accurate, timely seeding orders to structure their event brackets.

### User Personas

**Nick** (Seeding Committee Overseer)

- **Role:** Committee lead overseeing 18U Open rankings
- **Context:** Manages a 6-person committee across multiple age divisions; coordinates the final seeding output before the March 1st deadline
- **Pain Points:** Current Excel system is fragile (one broken formula cascades), hard to share with 6 reviewers, and nearly impossible to extend to additional age groups without duplicating entire spreadsheet systems
- **Goals:** A single system where committee members can upload tournament results, run all 5 ranking algorithms at once, review a unified ranking, and make manual adjustments before publishing

**Adam** (Age-Division Committee Member)

- **Role:** Committee member responsible for 17/18s rankings
- **Context:** Needs to ingest tournament results for his age divisions, review algorithmic output, and flag discrepancies or apply subjective criteria (appeals, head-to-head knowledge)
- **Pain Points:** Cannot easily see how each algorithm weighted a team; cross-referencing H2H records requires manual lookup across multiple sheets
- **Goals:** A dashboard showing each team's algorithmic breakdown, tournament history, and head-to-head record so he can make informed adjustments quickly

**Coach Rivera** (Club Director)

- **Role:** Head coach of a competitive 18U club team
- **Context:** Wants to understand why his team is seeded where it is at major national events
- **Pain Points:** Current rankings are opaque -- no way to see which tournaments or algorithms influenced seeding position
- **Goals:** A transparent view of his team's ranking breakdown showing tournament finishes, W/L record, and algorithmic ratings

## The Problem

### Manual Spreadsheets Cannot Scale

The AAU Seeding Committee currently manages rankings through manually-maintained Excel spreadsheets. The "18 Open Finishes" spreadsheet alone is 76 rows by 189 columns, tracking 73 teams across 60+ tournaments. A separate "18Open Colley" spreadsheet runs 5 different algorithmic models with cascading formulas. This system is fragile (one bad formula breaks downstream calculations), difficult to collaborate on (6 committee members need to review simultaneously), nearly impossible to extend (adding age groups means duplicating entire spreadsheet systems), and opaque to stakeholders who cannot understand how rankings are derived.

**Our Solution:** An automated engine that ingests the same CSV/Excel data the committee already produces, runs all 5 ranking algorithms (Colley Matrix + 4 Elo variants) programmatically, computes the unified AggRating and AggRank, and presents results in a sortable dashboard where committee members can review, adjust, and export final seedings.

## Differentiators

### Algorithmic Transparency Over Black-Box Rankings

Unlike the current spreadsheet system where formulas are buried in cells, the ranking engine surfaces each algorithm's individual contribution to a team's final rating. Committee members and coaches can see exactly how Colley, Elo-2200, Elo-2400, Elo-2500, and Elo-2700 each scored a team, and how those combine into the 0-100 AggRating.

### Multi-Model Consensus Instead of Single-Algorithm Bias

Unlike systems that rely on a single ranking formula, this engine runs 5 independent models and aggregates them. This reduces the distortion any one model can introduce and produces more robust, defensible rankings.

### Built for Committee Workflow

Unlike generic ranking tools, this system is designed around the AAU Seeding Guidelines criteria hierarchy: national event finishes, record against field, head-to-head, region ranking, and written appeals. Automated factors are computed; subjective factors are surfaced for human review.

## Key Features

### Core Features

- **Data Ingestion:** Upload Excel/CSV files matching existing spreadsheet formats to automatically parse team codes, tournament results, divisions, finishes, and W/L records.
- **Multi-Algorithm Ranking Engine:** Run 5 mathematical models (Colley Matrix linear system + 4 Elo variants with different starting ratings) and compute a unified AggRating (0-100 scale) and AggRank.
- **Tournament Weighting:** Apply tiered importance weights to tournament finishes following the official AAU priority order (Chi-Town Challenge, SoCal Winter Formal, Boys Winter Invitational, etc.).
- **Seeding Output:** Generate final seedings per AAU criteria with automated factors (H2H, record vs. field, national finishes) computed and subjective factors (appeals, committee knowledge) surfaced for manual review.

### Collaboration Features

- **Committee Dashboard:** Sortable, filterable rankings table where multiple committee members can view results, with team detail views showing tournament history, H2H records, and per-algorithm breakdowns.
- **Export Capabilities:** Export final rankings and seedings to formats compatible with existing committee workflows.

### Advanced Features

- **Multi-Age-Group Support:** Extensible architecture supporting 15U, 16U, 17U, and 18U divisions using the same data structures and algorithms with independent data sets.
- **Manual Override & Adjustment:** Committee members can apply manual ranking adjustments for subjective criteria and document reasoning, preserving an audit trail.
