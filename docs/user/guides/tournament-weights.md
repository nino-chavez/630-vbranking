# Guide: Managing Tournament Weights

This guide explains how to view and adjust tournament weights, which control how much influence each tournament has on the ranking computation.

---

## What Tournament Weights Do

Not all tournaments are equally important. A national championship should have more influence on rankings than a local weekend tournament. Tournament weights are multipliers that scale the impact of tournament results across all five ranking algorithms.

- A weight of **1.0** means the tournament has standard influence (the default).
- A weight of **3.0** means the tournament has three times the standard influence.
- A weight of **0.5** means the tournament has half the standard influence.
- A weight of **0.0** effectively removes the tournament from ranking calculations entirely.

The system provides five predefined tiers, each with a default weight:

| Tier   | Default Weight | Typical Use               |
| ------ | -------------- | ------------------------- |
| Tier 1 | 3.0x           | National Championship     |
| Tier 2 | 2.5x           | Major National tournament |
| Tier 3 | 2.0x           | Regional Championship     |
| Tier 4 | 1.5x           | Regional Qualifier        |
| Tier 5 | 1.0x           | Local Tournament          |

---

## Viewing Current Weights

1. Click **Weights** in the top navigation bar.
2. Select a **Season** from the dropdown.

**What you should see:** A table listing all tournaments for the selected season, with the following columns:

| Column     | Description                                                                      |
| ---------- | -------------------------------------------------------------------------------- |
| Tournament | The tournament name                                                              |
| Date       | The tournament date                                                              |
| Tier       | The currently assigned tier (dropdown selector)                                  |
| Weight     | The current weight multiplier (editable number field)                            |
| Status     | "Custom" if the weight has been changed from the default, or "Default" otherwise |

If no tournaments have been imported for the selected season, the page shows: "No tournaments found for this season."

---

## Adjusting Weights

### Using Tiers

The simplest way to adjust weights is to assign the appropriate tier:

1. Find the tournament in the table.
2. Click the **Tier** dropdown in that row.
3. Select the appropriate tier (Tier 1 through Tier 5).

**What you should see:** The weight field automatically updates to the tier's default value (e.g., selecting Tier 1 sets the weight to 3.0).

### Using Custom Values

For fine-grained control, you can enter a specific weight value:

1. Click the **Weight** number field for the tournament.
2. Type the desired weight value. You can use decimal values (e.g., 2.3).
3. The minimum value is 0.0 (which effectively excludes the tournament). The step increment is 0.1.

**What you should see:** The Status column changes to "Custom" for any tournament with a non-default weight.

### Saving Changes

1. After making your adjustments, click the **Save Weights** button at the bottom right of the table. This button is only enabled when you have unsaved changes.

**What you should see:** A green success banner confirming the number of weights saved (e.g., "Saved 3 weight(s)."). The save button becomes disabled again since there are no further unsaved changes.

If something goes wrong, a red error banner explains the issue.

---

## Impact on Ranking Results

Tournament weights affect all five ranking algorithms:

- **Colley Matrix:** Weighted games count more toward the Colley matrix diagonal and b-vector entries. A match at a Tier-1 tournament (weight 3.0) shifts a team's rating three times as much as a match at a Tier-5 tournament (weight 1.0).

- **Elo Ratings:** The K-factor (which controls how much a single game result changes a team's rating) is multiplied by the tournament weight. At a Tier-1 tournament (weight 3.0), rating changes are three times larger than at a Tier-5 tournament.

When you change tournament weights, you must **re-run the ranking computation** for the changes to take effect. Weights are applied at computation time; changing weights does not retroactively alter previous ranking runs.

---

## Best Practices

1. **Set weights before your first ranking run.** This avoids needing to re-run rankings after adjusting weights.

2. **Use tiers for consistency.** Assigning tournaments to tiers ensures similar tournaments are weighted identically. Use custom values only when a specific tournament warrants a non-standard weight.

3. **Discuss weight assignments with the committee.** Weight choices directly affect ranking outcomes. Document the committee's weighting policy so it can be applied consistently across seasons.

4. **Be conservative with extreme weights.** Very high weights (e.g., 5.0) can cause a single tournament to dominate the rankings. Very low weights (e.g., 0.1) can make a tournament nearly irrelevant. The predefined tier weights (1.0 to 3.0) represent a well-balanced range.

5. **Review weights when adding new tournaments.** Newly imported tournaments default to Tier 5 (weight 1.0). After importing new tournament data, visit the Weights page to verify that the new tournament has been assigned the correct tier.

6. **Keep the Tier Reference card in mind.** The Tier Reference card at the top of the Weights page provides a quick visual summary of the tier system. Use it as a guide when deciding which tier to assign.

---

_Last updated: 2026-02-24_
