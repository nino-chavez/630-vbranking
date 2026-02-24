# Requirements: Tournament Weighting & Seeding Criteria

## Pre-Established Decisions

These decisions are already documented in the roadmap and prior specs:

- **Database**: `tournament_weights` table already exists with `weight` (NUMERIC) and `tier` (INTEGER) columns, UNIQUE on `(tournament_id, season_id)`
- **Zod schema**: `tournamentWeightSchema` / `tournamentWeightInsertSchema` / `tournamentWeightUpdateSchema` already defined
- **5 algorithms unchanged**: Colley Matrix + 4 Elo variants (2200, 2400, 2500, 2700). Weights modify how these algorithms process data, not the algorithm structure itself.
- **Pure functions preserved**: Algorithm functions remain pure (accept data, return results). Weights are passed as parameters, not fetched inside algorithms.
- **Design system**: Use existing components (Card, Select, Button, Banner, DataTable, etc.) for any new UI.
- **Tech stack**: SvelteKit + TypeScript + Tailwind CSS v4 + Vitest

## Clarifying Questions & Answers

### Q1: How should tournament weights affect the Colley algorithm?

**A**: Multiply the contribution of each pairwise record by the tournament's weight. In the Colley matrix, a game from a tournament with weight=2.0 contributes as if it were 2 games: diagonal elements increase by `weight` instead of `1`, off-diagonal decrease by `weight` instead of `1`, and the b-vector changes by `weight * 0.5` instead of `0.5`. This preserves the mathematical properties of the Colley system while emphasizing results from higher-weighted tournaments. Unweighted tournaments default to weight=1.0.

### Q2: How should tournament weights affect Elo algorithms?

**A**: Scale the K-factor per tournament: `effective_K = base_K * weight`. A tournament with weight=2.0 produces double the normal rating change. This is the standard approach for weighted Elo -- it amplifies the impact of higher-stakes tournaments on ratings. Unweighted tournaments default to weight=1.0 (i.e., normal K-factor).

### Q3: What tournament tiers and default weights should be defined?

**A**: Define 5 tiers following the AAU priority order. Tier values are configurable per-tournament-per-season via the `tournament_weights` table. Default weight assignments:

| Tier | Weight | Example Tournaments |
|------|--------|-------------------|
| 1 (National Championship) | 3.0 | AAU Nationals, Boys Junior National Championship |
| 2 (Premier National) | 2.5 | Chi-Town Challenge, SoCal Winter Formal |
| 3 (Major Regional) | 2.0 | Boys Winter Invitational, Head of the Lakes |
| 4 (Standard Regional) | 1.5 | Capitol Hill Classic, Mideast Qualifier |
| 5 (Local/Other) | 1.0 | All other tournaments (default) |

Tournaments without an explicit weight entry default to Tier 5 / weight 1.0.

### Q4: What seeding factors should be computed and displayed?

**A**: Three supplementary seeding factors, computed per team:

1. **Win % vs Field**: `(total_wins / total_games) * 100`. Uses the same pairwise records as the algorithms. Displayed as a percentage.
2. **Head-to-Head Record**: For any pair of teams, their direct W/L record across all tournaments. Stored as a lookup, displayed on hover or in a detail view. Not part of this feature's UI -- just computed and available via API.
3. **National Event Finish**: Best finish position at Tier-1 tournaments. If a team has multiple Tier-1 finishes, show the best (lowest) one. Displayed as "1st at AAU Nationals" or "N/A" if no Tier-1 finishes.

These factors are NOT incorporated into the algorithmic ranking. They are displayed alongside rankings to help committee members evaluate the seeding order.

### Q5: How should tournament weights be managed?

**A**: A simple weight management page at `/ranking/weights` (sub-route of ranking). Shows all tournaments for the selected season in a table. Each row has editable weight and tier fields. Committee members can:
- View all tournaments with current weights
- Assign/change weight and tier for each tournament
- Unweighted tournaments show default values (tier 5, weight 1.0)
- Save changes persist to the `tournament_weights` table

A CRUD API endpoint supports this: `GET/PUT /api/ranking/weights`.

### Q6: Should ranking run parameters record the weights used?

**A**: Yes. The `parameters` JSON in `ranking_runs` should include a `weights` field that captures the tournament_id → weight mapping used for that run. This provides audit trail and reproducibility.

## Scope Summary

This spec defines:
1. **Weighted algorithms**: Modify Colley and Elo to accept and apply tournament weights
2. **Weight management**: API endpoints and UI page for managing tournament weights per season
3. **Seeding factors**: Compute win % vs field and best national finish per team
4. **Service integration**: RankingService fetches weights and passes them to algorithms
5. **Results augmentation**: Display seeding factors alongside algorithmic rankings
6. **Run parameters**: Record weight configuration in ranking run metadata

This spec does NOT include:
- Manual ranking overrides (Feature 7)
- Full dashboard with sorting/filtering/detail views (Feature 6)
- New algorithms or changes to the 5-algorithm structure
- H2H detail view UI (just the computation and API availability)
- Weight presets or import from external sources
