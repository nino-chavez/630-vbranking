// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import RankingResultsTable from '../RankingResultsTable.svelte';
import type { NormalizedTeamResult } from '$lib/ranking/types.js';

const sampleResults: NormalizedTeamResult[] = [
  {
    team_id: 'team-a',
    algo1_rating: 0.6667,
    algo1_rank: 1,
    algo2_rating: 2216.0,
    algo2_rank: 1,
    algo3_rating: 2416.0,
    algo3_rank: 1,
    algo4_rating: 2516.0,
    algo4_rank: 1,
    algo5_rating: 2716.0,
    algo5_rank: 1,
    agg_rating: 85.33,
    agg_rank: 1,
  },
  {
    team_id: 'team-b',
    algo1_rating: 0.5,
    algo1_rank: 2,
    algo2_rating: 2200.0,
    algo2_rank: 2,
    algo3_rating: 2400.0,
    algo3_rank: 2,
    algo4_rating: 2500.0,
    algo4_rank: 2,
    algo5_rating: 2700.0,
    algo5_rank: 2,
    agg_rating: 50.0,
    agg_rank: 2,
  },
  {
    team_id: 'team-c',
    algo1_rating: 0.3333,
    algo1_rank: 3,
    algo2_rating: 2184.0,
    algo2_rank: 3,
    algo3_rating: 2384.0,
    algo3_rank: 3,
    algo4_rating: 2484.0,
    algo4_rank: 3,
    algo5_rating: 2684.0,
    algo5_rank: 3,
    agg_rating: 14.67,
    agg_rank: 3,
  },
];

const sampleTeams = new Map([
  ['team-a', 'Alpha Wolves'],
  ['team-b', 'Bravo Bolts'],
  ['team-c', 'Charlie Cobras'],
]);

describe('RankingResultsTable', () => {
  afterEach(() => cleanup());
  it('renders the correct number of rows and expected column headers', () => {
    render(RankingResultsTable, {
      props: { results: sampleResults, teams: sampleTeams },
    });

    // Check header text
    expect(screen.getByText('Rank')).toBeTruthy();
    expect(screen.getByText('Team Name')).toBeTruthy();
    expect(screen.getByText('Colley Rating')).toBeTruthy();
    expect(screen.getByText('AggRating')).toBeTruthy();

    // Check row count: 3 team names should be present
    expect(screen.getByText('Alpha Wolves')).toBeTruthy();
    expect(screen.getByText('Bravo Bolts')).toBeTruthy();
    expect(screen.getByText('Charlie Cobras')).toBeTruthy();
  });

  it('displays rating values formatted to 2 decimal places', () => {
    render(RankingResultsTable, {
      props: { results: sampleResults, teams: sampleTeams },
    });

    // Colley rating for team-a: 0.6667 -> "0.67" (may appear in multiple cells)
    const cells067 = screen.getAllByText('0.67');
    expect(cells067.length).toBeGreaterThanOrEqual(1);

    // AggRating for team-a: 85.33 -> "85.33"
    expect(screen.getByText('85.33')).toBeTruthy();

    // AggRating for team-c: 14.67 -> "14.67"
    expect(screen.getByText('14.67')).toBeTruthy();
  });

  it('displays "No results" message when passed an empty array', () => {
    render(RankingResultsTable, {
      props: { results: [], teams: new Map() },
    });

    expect(screen.getByText('No results')).toBeTruthy();
  });
});
