# Explanation: How Rankings Work

This document explains, in plain language, how the Volleyball Ranking Engine computes team rankings. You do not need to understand the math to use the system, but understanding the approach helps you interpret results and explain them to others.

---

## The Big Picture: An Ensemble Approach

The system does not rely on a single formula to rank teams. Instead, it runs **five independent ranking algorithms**, each using a different method to assess team strength. It then combines all five results into a single final ranking.

This approach is called an **ensemble** method. The idea is the same as asking five knowledgeable people to independently rank all the teams, then averaging their opinions. No single method is perfect, but by combining several methods, the biases of each individual algorithm tend to cancel out, producing a more balanced and defensible ranking.

The five algorithms are:

| Algorithm   | Name          | Type                             |
| ----------- | ------------- | -------------------------------- |
| Algorithm 1 | Colley Matrix | Simultaneous (all games at once) |
| Algorithm 2 | Elo-2200      | Sequential (game by game)        |
| Algorithm 3 | Elo-2400      | Sequential (game by game)        |
| Algorithm 4 | Elo-2500      | Sequential (game by game)        |
| Algorithm 5 | Elo-2700      | Sequential (game by game)        |

---

## Algorithm 1: Colley Matrix

### What It Does

The Colley Matrix method looks at all games from the entire season at once and solves a mathematical equation to find the rating that best explains the observed win/loss records. It was originally developed for ranking college football teams in the Bowl Championship Series (BCS).

### How It Works (Simple Version)

1. Every team starts with a base rating of 0.5 (on a scale where 0 is worst and 1 is best).
2. The algorithm considers every game played: who won, who lost, and how many total games each team played.
3. It asks: "What rating for each team would best explain all the results we observed?"
4. It solves this question mathematically (using a technique called LU decomposition) to find a single rating for each team.
5. Teams are ranked by their Colley rating from highest to lowest.

### Key Properties

- **Time-independent:** It does not matter whether a game was played in September or January. All games count equally (unless tournament weights differ).
- **Self-correcting:** If Team A beats Team B, and Team B beats many other teams, that helps Team A's rating even though Team A did not play those other teams directly.
- **Simple inputs:** It only needs win/loss records, not scores or margins of victory.

### When Tournament Weights Apply

When a tournament has a weight greater than 1.0 (for example, a Tier-1 national championship with weight 3.0), each game at that tournament counts as if it happened multiple times. A game at a 3.0-weight tournament shifts ratings three times as much as a game at a 1.0-weight tournament.

---

## Algorithms 2-5: Elo Rating Variants

### What They Do

The Elo rating system processes games one by one in chronological order, updating each team's rating after every game. It was originally invented for chess rankings and is widely used in sports, gaming, and competitive systems worldwide.

The system runs four Elo variants that differ only in their **starting rating** -- the rating every team begins the season with:

| Algorithm | Starting Rating |
| --------- | --------------- |
| Elo-2200  | 2200            |
| Elo-2400  | 2400            |
| Elo-2500  | 2500            |
| Elo-2700  | 2700            |

### How It Works (Simple Version)

1. Every team starts the season with the same rating (e.g., 2400 for Algorithm 3).
2. Games are processed tournament by tournament, in the order the tournaments occurred.
3. Before each game, the system calculates the **expected outcome** based on the current ratings of both teams. If one team is rated much higher, the system expects that team to win.
4. After the game, ratings are updated:
   - If the higher-rated team wins (expected result), both ratings change by a small amount.
   - If the lower-rated team wins (upset), both ratings change by a larger amount.
5. The amount of change is controlled by the **K-factor** (set to 32 in this system). A higher K-factor means ratings respond more strongly to each game.
6. After all games have been processed, teams are ranked by their final rating.

### Why Four Variants?

Different starting ratings create different rating dynamics throughout the season:

- **Lower starting ratings (2200):** Rating changes are proportionally larger relative to the starting point. Early-season results have a stronger effect.
- **Higher starting ratings (2700):** The same K-factor produces proportionally smaller relative changes. The algorithm is somewhat more conservative.

By running four variants with different starting points, the system captures a range of perspectives on how sensitive ratings should be to individual results. When the four Elo results are averaged together (along with the Colley result), extreme outcomes from any single variant are smoothed out.

### When Tournament Weights Apply

Tournament weights scale the K-factor for games at that tournament. At a Tier-1 tournament (weight 3.0), the effective K-factor becomes 3.0 x 32 = 96, meaning each game result shifts ratings three times as much as a game at a weight-1.0 tournament.

---

## Normalization: Scaling to 0-100

Each algorithm produces ratings on a different scale:

- Colley ratings typically range from about 0.3 to 0.7
- Elo-2200 ratings might range from 1800 to 2600
- Elo-2700 ratings might range from 2400 to 3100

To combine these fairly, the system **normalizes** each algorithm's ratings to a common 0-100 scale using min-max normalization:

- The team with the highest rating in an algorithm gets a score of **100**.
- The team with the lowest rating gets a score of **0**.
- All other teams are scaled linearly between 0 and 100 based on where their rating falls in the range.

**Example:** If the highest Colley rating is 0.72 and the lowest is 0.31, a team with a rating of 0.515 would get a normalized score of:

```
(0.515 - 0.31) / (0.72 - 0.31) x 100 = 50.0
```

If all teams have the same rating in an algorithm (a rare edge case), all teams receive a normalized score of 50.0.

---

## Aggregation: Computing the Final Score

After normalization, each team has five scores on the 0-100 scale (one from each algorithm). The system computes the **AggRating** (Aggregate Rating) as the simple arithmetic mean:

```
AggRating = (Colley_norm + Elo2200_norm + Elo2400_norm + Elo2500_norm + Elo2700_norm) / 5
```

The result is rounded to two decimal places.

**Example:** A team with normalized scores of 92.5, 88.0, 90.2, 87.1, and 91.3 would have:

```
AggRating = (92.5 + 88.0 + 90.2 + 87.1 + 91.3) / 5 = 89.82
```

### Assigning the Aggregate Rank

Teams are sorted by AggRating from highest to lowest. The team with the highest AggRating is ranked 1st. If two teams have exactly the same AggRating (which is rare), the tie is broken alphabetically by team name (A before Z).

---

## Why an Ensemble Approach?

A single ranking algorithm can produce results that feel "wrong" for various reasons:

- **Colley alone** treats all games equally regardless of timing. A team that improved dramatically mid-season gets the same credit for early losses as for late wins.
- **Elo alone** is sensitive to the order games are played. Two teams with identical records can have different Elo ratings depending on when they played their games.
- **Any single starting rating** for Elo creates a specific bias in how the algorithm responds to early-season versus late-season results.

By combining five algorithms with different mathematical properties, the system reduces the impact of any single algorithm's quirks. The result is a ranking that:

- Reflects both season-long performance (Colley) and recent form (Elo)
- Is robust against sensitivity to specific parameter choices (multiple Elo starting ratings)
- Can be explained and defended based on multiple independent analyses
- Is consistent and reproducible (the same data always produces the same ranking)

When a team is ranked highly by all five algorithms, you can have strong confidence in that ranking. When algorithms disagree about a team (e.g., ranked 3rd by Colley but 12th by Elo-2700), it signals that the team's ranking depends on methodological assumptions, which is useful context for the committee when considering overrides.

---

## Summary

| Step                    | What Happens                                                              |
| ----------------------- | ------------------------------------------------------------------------- |
| 1. Data Collection      | Tournament finishes or match records are imported                         |
| 2. Win/Loss Derivation  | Pairwise win/loss records are derived from the data                       |
| 3. Colley Matrix        | All games are analyzed simultaneously to produce ratings                  |
| 4. Four Elo Variants    | Games are processed chronologically with four different starting ratings  |
| 5. Normalization        | All five sets of ratings are scaled to 0-100                              |
| 6. Aggregation          | The five normalized scores are averaged into a single AggRating           |
| 7. Ranking              | Teams are sorted by AggRating to produce the final AggRank                |
| 8. Overrides (optional) | The committee may adjust specific positions with documented justification |

---

_Last updated: 2026-02-24_
