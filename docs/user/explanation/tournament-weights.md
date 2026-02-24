# Explanation: Understanding Tournament Weights

This document explains why tournament weights exist, how they affect ranking calculations, and provides concrete examples to illustrate their impact.

---

## Why Different Tournaments Matter Differently

Not all volleyball tournaments are created equal. A national championship with 64 of the best teams in the country is a fundamentally different competitive environment than a local weekend tournament with 8 teams. A team that finishes 5th at nationals may have had a more impressive performance than a team that wins a small local event.

Without tournament weights, the ranking system would treat a win at a local tournament the same as a win at nationals. This would produce rankings that do not reflect the quality of competition each team faced.

Tournament weights solve this problem by allowing the committee to specify how much influence each tournament should have on the rankings. Tournaments with stronger fields of competition can be given higher weights so that results at those events count more.

---

## How the Tier System Works

The system organizes tournaments into five tiers, each with a default weight multiplier:

| Tier   | Weight | Description           | Example                         |
| ------ | ------ | --------------------- | ------------------------------- |
| Tier 1 | 3.0x   | National Championship | AAU National Championship       |
| Tier 2 | 2.5x   | Major National        | AAU Grand Prix                  |
| Tier 3 | 2.0x   | Regional Championship | Northeast Regional Championship |
| Tier 4 | 1.5x   | Regional Qualifier    | State qualifier tournament      |
| Tier 5 | 1.0x   | Local Tournament      | Weekend invitational            |

The weight is a multiplier. A weight of 3.0 means that results at that tournament count three times as much as results at a weight-1.0 tournament.

---

## How Weights Affect Rankings Mathematically

Tournament weights influence both the Colley Matrix and Elo algorithms. Here is a simplified explanation of each.

### Effect on Colley Matrix

In the Colley Matrix, each game between two teams adds information to a mathematical equation. When a game carries a weight of 1.0, it adds a standard amount of information. When a game carries a weight of 3.0, it adds three times as much.

Think of it this way: a weighted game at a Tier-1 tournament is treated as if the same two teams played each other three times with the same result. This means:

- Beating a strong opponent at nationals has a much larger positive effect on your rating than beating them at a local tournament.
- Losing to an opponent at nationals has a correspondingly larger negative effect.

### Effect on Elo Ratings

In the Elo system, the **K-factor** controls how much a single game can change a team's rating. The default K-factor is 32. Tournament weights multiply the K-factor:

| Tournament Weight | Effective K-Factor | Rating Change Multiplier |
| ----------------- | ------------------ | ------------------------ |
| 1.0 (Tier 5)      | 32                 | 1x (baseline)            |
| 1.5 (Tier 4)      | 48                 | 1.5x                     |
| 2.0 (Tier 3)      | 64                 | 2x                       |
| 2.5 (Tier 2)      | 80                 | 2.5x                     |
| 3.0 (Tier 1)      | 96                 | 3x                       |

A higher effective K-factor means each game result causes a bigger rating change. Wins are more rewarding and losses are more costly at higher-weight tournaments.

---

## Examples with Numbers

### Example 1: Two Teams, Different Tournament Performances

Consider two teams, the Hawks and the Eagles, who each play 10 games during the season.

**Hawks:**

- 5 wins at a Tier-1 national tournament (weight 3.0)
- 5 losses at local tournaments (weight 1.0)
- Raw record: 5-5

**Eagles:**

- 5 wins at local tournaments (weight 1.0)
- 5 losses at a Tier-1 national tournament (weight 3.0)
- Raw record: 5-5

Both teams have identical 5-5 records. Without weights, they would be rated similarly. But with weights:

- The Hawks' wins count for 3x each (like winning 15 unweighted games), while their losses count for 1x each (5 unweighted losses). Effective record: 15-5.
- The Eagles' wins count for 1x each (5 unweighted games), while their losses count for 3x each (like losing 15 unweighted games). Effective record: 5-15.

The Hawks would rank significantly higher because their wins came against national-level competition.

### Example 2: Impact of Changing a Tournament's Weight

Suppose Team Alpha has these season results:

| Tournament            | Weight | Games Won | Games Lost |
| --------------------- | ------ | --------- | ---------- |
| AAU Nationals         | 3.0    | 4         | 2          |
| Regional Championship | 2.0    | 3         | 1          |
| Local Invitational    | 1.0    | 2         | 0          |

Their effective game contributions:

- Nationals: 4 x 3.0 = 12 weighted wins, 2 x 3.0 = 6 weighted losses
- Regionals: 3 x 2.0 = 6 weighted wins, 1 x 2.0 = 2 weighted losses
- Local: 2 x 1.0 = 2 weighted wins, 0 x 1.0 = 0 weighted losses
- **Total: 20 weighted wins, 8 weighted losses**

Now suppose the committee realizes the Regional Championship should be Tier 1 (weight 3.0) instead of Tier 3 (weight 2.0):

- Nationals: 12 weighted wins, 6 weighted losses (unchanged)
- Regionals: 3 x 3.0 = 9 weighted wins, 1 x 3.0 = 3 weighted losses (increased)
- Local: 2 weighted wins, 0 weighted losses (unchanged)
- **Total: 23 weighted wins, 9 weighted losses**

The team's weighted wins increased from 20 to 23, and their weighted losses increased from 8 to 9. Because they had a winning record at regionals, raising the regional weight improved their overall ranking.

### Example 3: Why the Weight Range Matters

The default tier weights range from 1.0 to 3.0. This is a deliberate design choice:

- A 3:1 ratio means the most important tournament counts three times as much as the least important. This is significant but not overwhelming.
- If the ratio were 10:1 (weights from 1.0 to 10.0), a single game at nationals would matter as much as ten local games. This would make the ranking almost entirely dependent on national tournament performance, ignoring the rest of the season.
- If the ratio were only 1.5:1 (weights from 1.0 to 1.5), the weighting would barely matter, defeating the purpose.

The 3:1 range strikes a balance: national results carry more weight, but a consistent season of strong play at regional and local events still contributes meaningfully to a team's ranking.

---

## Key Takeaways

1. **Weights are multipliers.** A weight of 2.0 means results count twice as much; a weight of 0.5 means they count half as much.

2. **Weights cut both ways.** Higher weights amplify both wins and losses at that tournament. A team that performs poorly at a high-weight tournament will be penalized more than if the same losses happened at a low-weight tournament.

3. **Weights must be set before running rankings.** Changing weights after a ranking run does not retroactively update that run. You must run a new ranking computation for weight changes to take effect.

4. **The committee controls the weights.** The tier assignments and weight values are decisions made by the ranking committee based on their knowledge of the competitive landscape. The system provides defaults, but the committee should review and adjust weights each season.

5. **Consistent application matters.** Apply the same weighting criteria across all age groups and throughout the season. Document the committee's weighting policy so it can be referenced and applied uniformly.

---

_Last updated: 2026-02-24_
