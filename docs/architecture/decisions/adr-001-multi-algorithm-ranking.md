# ADR-001: Five-Algorithm Ensemble Ranking

## Status

Accepted

## Context

AAU volleyball rankings determine tournament seeding and carry significant weight with coaches, parents, and athletes. Rankings produced by a single algorithm are susceptible to disputes because each algorithm has inherent biases:

- **Colley Matrix** treats all games equally regardless of when they occurred during the season. It solves a linear system and is insensitive to temporal ordering.
- **Elo** processes games chronologically, so late-season results carry more influence. However, Elo is sensitive to the starting rating chosen -- two Elo systems with different initial ratings can produce meaningfully different rankings, especially for teams with few games.

The committee required a ranking methodology that is defensible, transparent (coaches can see per-algorithm breakdowns), and resilient to the biases of any single approach.

## Decision

The system runs five independent rating algorithms for each ranking computation:

| Algorithm        | Key   | Implementation              | Characteristic                                     |
| ---------------- | ----- | --------------------------- | -------------------------------------------------- |
| Colley Matrix    | algo1 | `src/lib/ranking/colley.ts` | Time-independent, solves Cr=b via LU decomposition |
| Elo (start=2200) | algo2 | `src/lib/ranking/elo.ts`    | Chronological, lower baseline                      |
| Elo (start=2400) | algo3 | `src/lib/ranking/elo.ts`    | Chronological, mid-low baseline                    |
| Elo (start=2500) | algo4 | `src/lib/ranking/elo.ts`    | Chronological, mid-high baseline                   |
| Elo (start=2700) | algo5 | `src/lib/ranking/elo.ts`    | Chronological, higher baseline                     |

After all five algorithms produce raw ratings, the normalization step (`normalizeAndAggregate`) applies min-max normalization to each algorithm's output, mapping ratings to a 0--100 scale. The aggregate rating (AggRating) is the arithmetic mean of the five normalized scores. AggRank is derived by sorting AggRating descending, with alphabetical tie-breaking by team name.

Tournament weights scale the impact of individual tournaments across all algorithms:

- In Colley, weights scale the diagonal and off-diagonal matrix entries and the b-vector.
- In Elo, weights scale the effective K-factor for matches in that tournament.

## Alternatives Considered

**Single Colley-only ranking.** Simpler implementation and fewer database columns. Rejected because it ignores the temporal dimension: a team that improves over the season is not rewarded for late-season performance.

**Single Elo with one starting rating.** Captures temporal dynamics. Rejected because starting-rating sensitivity creates fragile rankings, and there is no principled way to choose the "correct" starting value for AAU volleyball.

**Weighted ensemble with configurable coefficients.** The committee could assign different weights to each algorithm (e.g., 30% Colley, 17.5% each Elo). Deferred as premature complexity. The current equal-weight arithmetic mean provides a defensible baseline. The architecture supports future coefficient configurability by modifying `normalizeAndAggregate` without schema changes.

**Glicko-2 or TrueSkill.** More sophisticated rating systems that model uncertainty. Rejected because the committee values transparency and simplicity over statistical sophistication. Colley and Elo are well-understood and explainable.

## Consequences

**Easier:**

- Committee members see five independent perspectives on team strength, increasing confidence in the final ranking.
- Disagreements between algorithms highlight genuinely close matchups, providing the committee with information for targeted overrides.
- Adding a new algorithm variant (e.g., a sixth Elo starting rating) requires only adding a column to the database and an entry in the algorithm map.

**More difficult:**

- Storage cost: 12 numeric columns per team per run (5 algorithms x 2 columns + agg_rating + agg_rank).
- Computation time scales linearly with the number of algorithms. Five algorithms take approximately 5x the time of a single one.
- Export reports must accommodate 10+ data columns per team when algorithm breakdowns are included, requiring landscape PDF orientation.
- The hardcoded algorithm count (algo1--algo5) appears in the database schema, Zod schemas, type definitions, service code, export module, and UI components. Changing the algorithm count requires coordinated updates across all of these.

## Evidence

- Algorithm implementations: `src/lib/ranking/colley.ts`, `src/lib/ranking/elo.ts`
- Normalization and aggregation: `src/lib/ranking/normalize.ts`
- Orchestration: `src/lib/ranking/ranking-service.ts` (lines 259--283, `executeAlgorithms`)
- Database schema: `supabase/migrations/20260223180011_create_ranking_results_table.sql`
- Type definitions: `src/lib/ranking/types.ts` (`AlgorithmResultMap`, `NormalizedTeamResult`)
- Elo constants: `src/lib/ranking/elo.ts` (`ELO_STARTING_RATINGS = [2200, 2400, 2500, 2700]`, `DEFAULT_K_FACTOR = 32`)
