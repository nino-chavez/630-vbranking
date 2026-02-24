# Guide: Overrides and Finalization

This guide explains how the ranking committee can apply manual adjustments to team rankings and how to finalize a ranking run to lock it from further changes.

---

## When to Apply Overrides

Overrides allow the committee to adjust a team's final rank position when the algorithmic ranking does not fully reflect the committee's assessment. Common reasons for overrides include:

- A team had an exceptionally strong or weak showing at a late-season tournament that the algorithms have not fully accounted for
- Scheduling or travel issues caused a team to miss tournaments, deflating their algorithmic ranking
- Head-to-head results between closely ranked teams favor a different ordering
- The committee has context (such as roster changes) that the algorithms do not capture

Overrides are meant to be used sparingly and with documented justification. Every override creates an audit trail that records the original algorithmic rank, the new rank, the reason, and the committee member who made the change.

---

## How to Add an Override

1. Navigate to the **Rankings** page and run or load a ranking computation (see [Running Rankings](running-rankings.md)).
2. Find the team you want to adjust in the results table.
3. Click the **Adjust** button in the rightmost column of that team's row.

**What you should see:** A slide-out panel appears on the right side of the screen titled "Committee Override." The panel shows:

- The team name
- The team's current algorithmic rank

4. In the **Final Seed** field, enter the rank position you want to assign to this team (for example, if you want the team to be ranked 3rd, enter `3`).
5. In the **Justification** text area, explain why this override is being applied. The justification must be at least 10 characters long. Be specific -- this text becomes part of the permanent audit record.
6. In the **Committee Member** field, enter the name of the person making this decision. The name must be at least 2 characters long.
7. Click **Save Override**.

**What you should see:** The panel closes. The results table now shows two rank columns:

- **Final Seed** -- The rank after overrides are applied, with an "ADJ" badge next to teams that have been adjusted
- **Algo Rank** -- The original algorithmic rank (for comparison)

---

## Providing a Reason

Every override requires a written justification. Good justifications:

- Explain the specific circumstances that warrant the adjustment
- Reference concrete evidence (tournament results, head-to-head records, etc.)
- Are clear enough that someone reviewing the override later will understand the rationale

**Examples of good justifications:**

- "Team placed 2nd at AAU Nationals but ranked 6th algorithmically due to limited regular-season data. Committee adjusts based on national performance."
- "Head-to-head record of 3-0 against the team currently ranked above them. Committee moves team up to reflect direct competition results."

**Examples of poor justifications:**

- "Committee decision" (too vague)
- "Adjusted" (not informative)

---

## Reviewing Active Overrides

When overrides are active on a ranking run, the results table displays them prominently:

- The **Final Seed** column appears as the primary rank column
- Teams with overrides show an **ADJ** badge next to their final seed
- The **Algo Rank** column shows the original algorithmic rank for comparison
- Clicking the **Edit** button (which replaces "Adjust" for teams with existing overrides) reopens the override panel with the current override details pre-filled

To review all active overrides at once, you can also export the results (see [Exporting Results](exporting-results.md)). The exported file includes an Override Summary section listing all overrides with their justifications.

---

## Editing an Existing Override

1. Click the **Edit** button next to the team's final seed in the results table.
2. The override panel opens with the current values pre-filled.
3. Modify the **Final Seed**, **Justification**, or **Committee Member** fields as needed.
4. Click **Update Override**.

**What you should see:** The panel closes and the results table updates with the new override values.

---

## Removing an Override

1. Click the **Edit** button next to the team's final seed.
2. In the override panel, click the **Remove** button (shown in red).

**What you should see:** The override is deleted. The team reverts to its original algorithmic rank. If no overrides remain on any team, the "Final Seed" and "Algo Rank" columns collapse back into a single "Rank" column.

---

## Finalizing a Ranking Run

Finalization locks a ranking run so that no further overrides can be added, edited, or removed. This is intended for when the committee has reached a final decision and wants to publish official rankings.

### How to Finalize

1. Make sure all desired overrides have been applied and reviewed.
2. Click the **Finalize Run** button at the bottom of the results page. This button only appears when the run is in "draft" status and at least one override exists.

**What you should see:** A blue information banner appears at the top of the page: "This ranking run has been finalized. Overrides are locked and cannot be modified."

### What Finalization Means

- The ranking run status changes from "draft" to "finalized"
- All overrides become read-only -- they cannot be added, edited, or removed
- The Adjust/Edit buttons are no longer shown in the results table
- The Finalize Run button disappears
- The override panel shows a read-only view if opened
- The run is marked as "(Finalized)" in the Previous Runs dropdown
- Exported reports show the status as "finalized"

### Finalization Cannot Be Undone

There is no way to un-finalize a ranking run through the application. If you need to make changes after finalization, you must run a new ranking computation, which creates a new run that starts in "draft" status.

### Best Practices for Finalization

- **Review all overrides carefully** before finalizing. Double-check final seed positions and justifications.
- **Export a report** before finalizing so you have a record of the results at the time of finalization.
- **Communicate with the full committee** before finalizing. Once locked, changes require a new ranking run.
- **Keep finalized runs as the official record.** When viewing the Previous Runs dropdown, finalized runs serve as the authoritative ranking for that point in time.

---

_Last updated: 2026-02-24_
