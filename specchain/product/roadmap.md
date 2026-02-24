# Product Roadmap

1. [x] **Data Model & Database Schema** -- Define and migrate the core database tables: teams (name, code, region), tournaments (name, weight/tier, date), tournament results (team, tournament, division, finish, field size), and match records (team A, team B, score, tournament). This is the foundation every other feature depends on. `M`

2. [x] **Data Ingestion Pipeline** -- Build a file upload and parsing system that accepts Excel/CSV files matching the existing "18 Open Finishes" spreadsheet format, maps columns to teams/tournaments/results, validates data integrity (unknown team codes, duplicate entries, missing fields), and persists parsed records to the database. `L`

3. [x] **Ranking Algorithm Engine** -- Implement the 5 mathematical rating models: Colley Matrix (construct and solve the linear system) and 4 Elo variants (starting ratings 2200, 2400, 2500, 2700). Each model produces an independent rating and rank per team. Compute the unified AggRating (0-100 normalized scale) and AggRank from the 5 model outputs. `L`

4. [x] **Tournament Weighting & Seeding Criteria** -- Apply tiered importance weights to tournament finishes following AAU priority order (Chi-Town Challenge through AAU Nationals). Compute automated seeding factors: record vs. field win percentage, head-to-head records between teams, and weighted national event finishes. Combine these with algorithmic rankings to produce the final seeding order. `M`

5. [x] **Design System & UI Foundation** -- Define the visual design system following the Clarity → Trust → Action framework (see `specchain/product/design-principles.md`). Establish color palette (60-30-10 rule), typography scale, spacing system, component patterns, and information architecture. This includes layout primitives, data table styling, card patterns, and the visual language for ranking data (color-coded tiers, sparklines, algorithm contribution indicators). Must be defined before any UI implementation. `M`

6. [x] **Rankings Dashboard** -- Build a sortable, filterable rankings table displaying each team's AggRank, AggRating, W/L record, and region. Include a team detail view that shows the full tournament history, per-algorithm rating breakdown (Colley + 4 Elo scores), and head-to-head record against other ranked teams. Apply the design system from Feature 5. `L`

7. [ ] **Manual Overrides & Committee Adjustments** -- Enable committee members to apply manual ranking adjustments for subjective criteria (written appeals, individual data known about teams, club history). Each adjustment requires a text justification and is stored with an audit trail. The dashboard reflects both the algorithmic ranking and the committee-adjusted final seeding. `M`

8. [ ] **Export & Reporting** -- Generate exportable ranking reports in CSV and PDF formats. Include the final seeding order, per-team breakdowns, and a summary of any manual adjustments applied. Designed for distribution to tournament organizers and for committee records. `S`

9. [ ] **Multi-Age-Group Support** -- Extend the system to support 15U, 16U, and 17U divisions alongside 18U. Each age group operates as an independent data set using the same schema, algorithms, and UI, selectable via an age-group switcher in the dashboard. `M`

> Notes
> - 9 items total, ordered by strict technical dependency chain
> - Items 1-4 form the algorithmic core (data in, rankings out)
> - Item 5 establishes the visual design system before any UI work
> - Item 6 makes rankings visible and reviewable
> - Items 7-8 complete the committee workflow
> - Item 9 scales the system to all age divisions
