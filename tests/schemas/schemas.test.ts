import { describe, it, expect } from 'vitest';
import {
  teamSchema,
  matchSchema,
  tournamentResultSchema,
  seasonSchema,
} from '../../src/lib/schemas/index';

// Helper: generate a valid UUID v4
const uuid = () => '550e8400-e29b-41d4-a716-446655440000';
const uuid2 = () => '660e8400-e29b-41d4-a716-446655440001';
const uuid3 = () => '770e8400-e29b-41d4-a716-446655440002';
const now = () => '2026-01-15T00:00:00Z';

describe('teamSchema', () => {
  const validTeamBase = {
    id: uuid(),
    name: 'Thunder VBC',
    code: 'THUN',
    region: 'Northeast',
    created_at: now(),
    updated_at: now(),
  };

  it('accepts valid team data with each age group', () => {
    for (const age_group of ['15U', '16U', '17U', '18U'] as const) {
      const result = teamSchema.safeParse({ ...validTeamBase, age_group });
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid age group (19U)', () => {
    const result = teamSchema.safeParse({ ...validTeamBase, age_group: '19U' });
    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    // Missing name
    const noName = teamSchema.safeParse({
      id: uuid(),
      code: 'THUN',
      region: 'Northeast',
      age_group: '16U',
      created_at: now(),
      updated_at: now(),
    });
    expect(noName.success).toBe(false);

    // Missing code
    const noCode = teamSchema.safeParse({
      id: uuid(),
      name: 'Thunder VBC',
      region: 'Northeast',
      age_group: '16U',
      created_at: now(),
      updated_at: now(),
    });
    expect(noCode.success).toBe(false);

    // Missing region
    const noRegion = teamSchema.safeParse({
      id: uuid(),
      name: 'Thunder VBC',
      code: 'THUN',
      age_group: '16U',
      created_at: now(),
      updated_at: now(),
    });
    expect(noRegion.success).toBe(false);
  });
});

describe('matchSchema', () => {
  const validMatch = {
    id: uuid(),
    team_a_id: uuid(),
    team_b_id: uuid2(),
    winner_id: uuid(),
    tournament_id: uuid3(),
    set_scores: null,
    point_differential: null,
    metadata: null,
    created_at: now(),
    updated_at: now(),
  };

  it('rejects team_a_id === team_b_id', () => {
    const sameTeam = { ...validMatch, team_a_id: uuid(), team_b_id: uuid() };
    const result = matchSchema.safeParse(sameTeam);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain('team_a_id and team_b_id must be different');
    }
  });

  it('rejects invalid winner_id (not a participant)', () => {
    const badWinner = { ...validMatch, winner_id: uuid3() };
    const result = matchSchema.safeParse(badWinner);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        'winner_id must be either team_a_id or team_b_id when not null',
      );
    }
  });

  it('accepts null winner_id, set_scores, point_differential, and metadata', () => {
    const nullableMatch = {
      ...validMatch,
      winner_id: null,
      set_scores: null,
      point_differential: null,
      metadata: null,
    };
    const result = matchSchema.safeParse(nullableMatch);
    expect(result.success).toBe(true);
  });
});

describe('tournamentResultSchema', () => {
  const validResult = {
    id: uuid(),
    team_id: uuid(),
    tournament_id: uuid2(),
    division: 'Open',
    finish_position: 3,
    field_size: 16,
    created_at: now(),
    updated_at: now(),
  };

  it('rejects finish_position > field_size', () => {
    const bad = { ...validResult, finish_position: 20, field_size: 16 };
    const result = tournamentResultSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        'finish_position must be less than or equal to field_size',
      );
    }
  });
});

describe('seasonSchema', () => {
  const validSeason = {
    id: uuid(),
    name: 'Fall 2026',
    start_date: '2026-09-01',
    end_date: '2026-12-15',
    is_active: true,
    created_at: now(),
    updated_at: now(),
  };

  it('accepts valid ranking scope values and rejects invalid ones', () => {
    // single_season
    const ss = seasonSchema.safeParse({
      ...validSeason,
      ranking_scope: 'single_season',
    });
    expect(ss.success).toBe(true);

    // cross_season
    const cs = seasonSchema.safeParse({
      ...validSeason,
      ranking_scope: 'cross_season',
    });
    expect(cs.success).toBe(true);

    // invalid value
    const invalid = seasonSchema.safeParse({
      ...validSeason,
      ranking_scope: 'multi_year',
    });
    expect(invalid.success).toBe(false);
  });
});
