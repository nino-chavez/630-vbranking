# User Documentation

Welcome to the Volleyball Ranking Engine user documentation. This guide is written for AAU volleyball ranking committee members who need to import tournament data, compute rankings, review results, apply overrides, and export reports.

## Quick Links

| I want to...                         | Go to                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Get started for the first time       | [Getting Started Tutorial](tutorials/getting-started.md)                 |
| Import a spreadsheet                 | [Importing Data Guide](guides/importing-data.md)                         |
| Run a ranking computation            | [Running Rankings Guide](guides/running-rankings.md)                     |
| Override a team's rank               | [Overrides and Finalization Guide](guides/overrides-and-finalization.md) |
| Export results to CSV, Excel, or PDF | [Exporting Results Guide](guides/exporting-results.md)                   |
| Adjust tournament weights            | [Tournament Weights Guide](guides/tournament-weights.md)                 |

## Documentation Structure

This documentation follows the [Diataxis](https://diataxis.fr/) framework and is organized into four quadrants:

### Tutorials (Learning-Oriented)

Step-by-step lessons that take you through the complete workflow from start to finish.

- [Getting Started](tutorials/getting-started.md) -- Your first ranking, from data import to export

### Guides (Task-Oriented)

Practical instructions for accomplishing specific tasks.

- [Importing Data](guides/importing-data.md) -- Upload and validate tournament spreadsheets
- [Running Rankings](guides/running-rankings.md) -- Compute and review team rankings
- [Overrides and Finalization](guides/overrides-and-finalization.md) -- Apply committee adjustments and lock results
- [Exporting Results](guides/exporting-results.md) -- Download rankings as CSV, Excel, or PDF
- [Managing Tournament Weights](guides/tournament-weights.md) -- Control how much each tournament matters

### Reference (Information-Oriented)

Technical specifications and data format details.

- [API Reference](reference/api-reference.md) -- REST API endpoint documentation
- [Data Format Specifications](reference/data-formats.md) -- Spreadsheet column layouts and export formats

### Explanation (Understanding-Oriented)

Background information explaining how and why the system works the way it does.

- [How Rankings Work](explanation/ranking-algorithms.md) -- The five-algorithm ensemble approach explained in plain language
- [Understanding Tournament Weights](explanation/tournament-weights.md) -- Why different tournaments matter differently

## Application Overview

The Volleyball Ranking Engine computes team rankings for AAU volleyball across four age groups (15U, 16U, 17U, 18U). It uses a five-algorithm ensemble approach that combines one Colley Matrix rating with four Elo rating variants, averages them into a single aggregate score, and produces a final ranking.

### Main Pages

The application has three main sections, accessible from the navigation bar at the top of every page:

| Page         | URL Path           | Purpose                                     |
| ------------ | ------------------ | ------------------------------------------- |
| **Import**   | `/import`          | Upload tournament data spreadsheets         |
| **Rankings** | `/ranking`         | Run ranking computations and review results |
| **Weights**  | `/ranking/weights` | Manage tournament importance weights        |

### Typical Workflow

1. **Import** tournament finishes data from an Excel spreadsheet
2. **Adjust weights** for each tournament (optional)
3. **Run** the ranking computation for a season and age group
4. **Review** the results table
5. **Override** specific team positions if the committee decides (optional)
6. **Finalize** the ranking run to lock it from further changes
7. **Export** the results as CSV, Excel, or PDF

---

_Last updated: 2026-02-24_
