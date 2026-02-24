import { describe, it, expect, vi } from 'vitest';
import { RankingService } from '../ranking-service.js';

/**
 * Create a mock Supabase client that returns configured data for each table.
 */
function createMockSupabase(overrides: {
  seasons?: { data: unknown; error: unknown };
  teams?: { data: unknown; error: unknown };
  tournaments?: { data: unknown; error: unknown };
  matches?: { count: number | null };
  tournament_results?: { data: unknown; error: unknown };
  ranking_runs_insert?: { data: unknown; error: unknown };
  ranking_results_insert?: { data: unknown; error: unknown };
  ranking_results_select?: { data: unknown; error: unknown };
  ranking_results_delete?: { data: unknown; error: unknown };
  ranking_runs_delete?: { data: unknown; error: unknown };
}) {
  const deleteTracker = {
    ranking_results_deleted: false,
    ranking_runs_deleted: false,
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'seasons') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve(
                  overrides.seasons ?? { data: { id: 'season-1' }, error: null }
                ),
            }),
          }),
        };
      }

      if (table === 'teams') {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve(
                  overrides.teams ?? {
                    data: [
                      { id: 'team-a', name: 'Alpha', code: 'ALP' },
                      { id: 'team-b', name: 'Bravo', code: 'BRA' },
                      { id: 'team-c', name: 'Charlie', code: 'CHA' },
                    ],
                    error: null,
                  }
                ),
            }),
          }),
        };
      }

      if (table === 'tournaments') {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve(
                  overrides.tournaments ?? {
                    data: [
                      { id: 'tourn-1', date: '2026-01-15' },
                      { id: 'tourn-2', date: '2026-02-20' },
                    ],
                    error: null,
                  }
                ),
            }),
          }),
        };
      }

      if (table === 'matches') {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                count: overrides.matches?.count ?? 0,
                data: null,
                error: null,
              }),
          }),
        };
      }

      if (table === 'tournament_results') {
        return {
          select: () => ({
            in: () =>
              Promise.resolve(
                overrides.tournament_results ?? {
                  data: [
                    { team_id: 'team-a', tournament_id: 'tourn-1', division: 'Open', finish_position: 1 },
                    { team_id: 'team-b', tournament_id: 'tourn-1', division: 'Open', finish_position: 2 },
                    { team_id: 'team-c', tournament_id: 'tourn-1', division: 'Open', finish_position: 3 },
                    { team_id: 'team-a', tournament_id: 'tourn-2', division: 'Open', finish_position: 2 },
                    { team_id: 'team-b', tournament_id: 'tourn-2', division: 'Open', finish_position: 1 },
                    { team_id: 'team-c', tournament_id: 'tourn-2', division: 'Open', finish_position: 3 },
                  ],
                  error: null,
                }
              ),
          }),
        };
      }

      if (table === 'ranking_runs') {
        return {
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve(
                  overrides.ranking_runs_insert ?? {
                    data: { id: 'run-123' },
                    error: null,
                  }
                ),
            }),
          }),
          delete: () => ({
            eq: () => {
              deleteTracker.ranking_runs_deleted = true;
              return Promise.resolve(
                overrides.ranking_runs_delete ?? { error: null }
              );
            },
          }),
        };
      }

      if (table === 'ranking_results') {
        return {
          insert: () =>
            Promise.resolve(
              overrides.ranking_results_insert ?? { error: null }
            ),
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve(
                  overrides.ranking_results_select ?? { data: [], error: null }
                ),
            }),
          }),
          delete: () => ({
            eq: () => {
              deleteTracker.ranking_results_deleted = true;
              return Promise.resolve(
                overrides.ranking_results_delete ?? { error: null }
              );
            },
          }),
        };
      }

      return {};
    }),
    _deleteTracker: deleteTracker,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client as any;
}

describe('RankingService', () => {
  const defaultConfig = {
    season_id: 'season-1',
    age_group: '18U' as const,
    k_factor: 32,
    elo_starting_ratings: [2200, 2400, 2500, 2700],
  };

  it('orchestrates a full ranking run with 3 teams and 2 tournaments', async () => {
    const supabase = createMockSupabase({});
    const service = new RankingService(supabase);

    const output = await service.runRanking(defaultConfig);

    expect(output.ranking_run_id).toBe('run-123');
    expect(output.teams_ranked).toBe(3);
    expect(output.results).toHaveLength(3);
    expect(output.ran_at).toBeTruthy();

    // Verify results have the expected structure
    for (const result of output.results) {
      expect(result.team_id).toBeTruthy();
      expect(typeof result.algo1_rating).toBe('number');
      expect(typeof result.algo1_rank).toBe('number');
      expect(typeof result.agg_rating).toBe('number');
      expect(typeof result.agg_rank).toBe('number');
    }

    // AggRank should be 1, 2, 3
    const ranks = output.results.map((r) => r.agg_rank).sort();
    expect(ranks).toEqual([1, 2, 3]);
  });

  it('cleans up ranking run record on algorithm failure', async () => {
    const supabase = createMockSupabase({
      // Return no tournament results to force an empty pairwise set
      // but set ranking_results insert to fail
      ranking_results_insert: {
        data: null,
        error: { message: 'DB insert failed' },
      },
    });

    const service = new RankingService(supabase);

    await expect(service.runRanking(defaultConfig)).rejects.toThrow(
      'Failed to insert ranking results'
    );

    // Verify cleanup was called
    expect(supabase._deleteTracker.ranking_results_deleted).toBe(true);
    expect(supabase._deleteTracker.ranking_runs_deleted).toBe(true);
  });

  it('throws for invalid season_id', async () => {
    const supabase = createMockSupabase({
      seasons: { data: null, error: { message: 'not found' } },
    });

    const service = new RankingService(supabase);

    await expect(service.runRanking(defaultConfig)).rejects.toThrow('Season not found');
  });

  it('throws for invalid age_group', async () => {
    const supabase = createMockSupabase({});
    const service = new RankingService(supabase);

    await expect(
      service.runRanking({ ...defaultConfig, age_group: 'INVALID' })
    ).rejects.toThrow('Invalid age_group');
  });

  it('getRunResults returns results sorted by agg_rank', async () => {
    const supabase = createMockSupabase({
      ranking_results_select: {
        data: [
          {
            team_id: 'team-a',
            algo1_rating: 0.6,
            algo1_rank: 1,
            algo2_rating: 2216,
            algo2_rank: 1,
            algo3_rating: 2416,
            algo3_rank: 1,
            algo4_rating: 2516,
            algo4_rank: 1,
            algo5_rating: 2716,
            algo5_rank: 1,
            agg_rating: 85.5,
            agg_rank: 1,
          },
          {
            team_id: 'team-b',
            algo1_rating: 0.5,
            algo1_rank: 2,
            algo2_rating: 2200,
            algo2_rank: 2,
            algo3_rating: 2400,
            algo3_rank: 2,
            algo4_rating: 2500,
            algo4_rank: 2,
            algo5_rating: 2700,
            algo5_rank: 2,
            agg_rating: 50.0,
            agg_rank: 2,
          },
        ],
        error: null,
      },
    });

    const service = new RankingService(supabase);
    const results = await service.getRunResults('run-123');

    expect(results).toHaveLength(2);
    expect(results[0].agg_rank).toBe(1);
    expect(results[1].agg_rank).toBe(2);
    expect(results[0].team_id).toBe('team-a');
  });
});
