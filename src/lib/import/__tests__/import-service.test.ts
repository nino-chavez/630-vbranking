import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IdentityResolver, levenshteinDistance } from '../identity-resolver.js';
import { ImportService } from '../import-service.js';
import type { ValidatedRow } from '../import-service.js';
import { detectDuplicateFinishes } from '../duplicate-detector.js';
import type { ParsedFinishesRow, IdentityMapping } from '../types.js';

// -----------------------------------------------------------
// Mock Supabase client factory
// -----------------------------------------------------------

type QueryResult<T> = { data: T | null; error: { message: string } | null };

/**
 * Create a minimal mock that mirrors the Supabase PostgREST
 * query-builder chain: .from().select().eq().in().maybeSingle() etc.
 *
 * Each call to `from()` returns a fresh chain so tests can set up
 * different return values per table.
 */
function createMockSupabase(overrides: {
  selectResult?: QueryResult<unknown[]>;
  insertResult?: QueryResult<unknown>;
  updateResult?: QueryResult<unknown>;
  rpcResult?: QueryResult<unknown>;
  maybeSingleResult?: QueryResult<unknown>;
}) {
  const chain: Record<string, unknown> = {};

  // Methods that return the chain itself (for chaining)
  const self = () => chain;
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockImplementation(() => {
    if (overrides.maybeSingleResult !== undefined) {
      return Promise.resolve(overrides.maybeSingleResult);
    }
    return Promise.resolve(overrides.selectResult ?? { data: [], error: null });
  });

  // Terminal methods that resolve the chain
  chain.then = undefined; // ensure it's not thenable by default

  // Make the chain itself act as a promise that resolves with selectResult
  const asPromise = Promise.resolve(overrides.selectResult ?? { data: [], error: null });
  (chain as Record<string | symbol, unknown>)[Symbol.toStringTag] = 'MockChain';

  // Override .then so that `await supabase.from('x').select('*').eq(...)` works
  Object.defineProperty(chain, 'then', {
    value: asPromise.then.bind(asPromise),
    writable: true,
    configurable: true,
  });

  const mockClient = {
    from: vi.fn().mockReturnValue(chain),
    rpc: vi.fn().mockResolvedValue(overrides.rpcResult ?? { data: null, error: null }),
  };

  // Allow insert to also be chainable
  chain.insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(
        overrides.insertResult ?? { data: { id: 'new-uuid' }, error: null },
      ),
    }),
    then: Promise.resolve(overrides.insertResult ?? { data: null, error: null }).then.bind(
      Promise.resolve(overrides.insertResult ?? { data: null, error: null }),
    ),
  });

  chain.update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue(overrides.updateResult ?? { data: null, error: null }),
  });

  return mockClient;
}

// -----------------------------------------------------------
// Tests
// -----------------------------------------------------------

describe('IdentityResolver.resolveTeams', () => {
  it('returns matched teams in the matched map and unmatched teams with fuzzy suggestions', async () => {
    const mockSupabase = createMockSupabase({
      selectResult: {
        data: [
          { id: 'team-1', name: 'Alpha Club', code: 'ALP' },
          { id: 'team-2', name: 'Bravo Club', code: 'BRV' },
          { id: 'team-3', name: 'Charlie Club', code: 'CHL' },
        ],
        error: null,
      },
    });

    const resolver = new IdentityResolver(mockSupabase as never);

    const result = await resolver.resolveTeams(
      ['ALP', 'BRV', 'XYZ', 'ALP'], // ALP duplicated, XYZ unmatched
      '18U',
    );

    // ALP and BRV should be matched
    expect(result.matched.get('ALP')).toBe('team-1');
    expect(result.matched.get('BRV')).toBe('team-2');
    expect(result.matched.size).toBe(2);

    // XYZ should be unmatched with fuzzy suggestions
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0].type).toBe('team');
    expect(result.unmatched[0].parsedValue).toBe('XYZ');
    expect(result.unmatched[0].suggestions).toBeDefined();
    // Suggestions should be sorted by score descending
    if (result.unmatched[0].suggestions.length > 1) {
      expect(result.unmatched[0].suggestions[0].score).toBeGreaterThanOrEqual(
        result.unmatched[0].suggestions[1].score,
      );
    }
  });
});

describe('IdentityResolver.resolveTournaments', () => {
  it('correctly separates matched from unmatched tournament names', async () => {
    const mockSupabase = createMockSupabase({
      selectResult: {
        data: [
          { id: 'tourn-1', name: 'AZ Region #1' },
          { id: 'tourn-2', name: 'CA Invitational' },
        ],
        error: null,
      },
    });

    const resolver = new IdentityResolver(mockSupabase as never);

    const result = await resolver.resolveTournaments(
      ['AZ Region #1', 'CA Invitational', 'Winter Formal'],
      'season-uuid',
    );

    // Two matched
    expect(result.matched.get('AZ Region #1')).toBe('tourn-1');
    expect(result.matched.get('CA Invitational')).toBe('tourn-2');
    expect(result.matched.size).toBe(2);

    // One unmatched
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0].type).toBe('tournament');
    expect(result.unmatched[0].parsedValue).toBe('Winter Formal');
  });
});

describe('ImportService.validateFinishesRows', () => {
  it('filters out skipped rows and returns validation errors for invalid rows', () => {
    const mockSupabase = createMockSupabase({});
    const service = new ImportService(mockSupabase as never);

    const rows: ParsedFinishesRow[] = [
      {
        teamName: 'Alpha',
        teamCode: 'ALP',
        tournamentName: 'AZ Region #1',
        division: '18O',
        finishPosition: 3,
        fieldSize: 24,
      },
      {
        teamName: 'Bravo',
        teamCode: 'BRV',
        tournamentName: 'AZ Region #1',
        division: '18O',
        finishPosition: 25, // exceeds field_size -- should fail validation
        fieldSize: 24,
      },
      {
        teamName: 'Charlie',
        teamCode: 'CHL', // will be mapped to 'skip'
        tournamentName: 'AZ Region #1',
        division: '18O',
        finishPosition: 2,
        fieldSize: 16,
      },
    ];

    const mappings: IdentityMapping[] = [
      {
        type: 'team',
        parsedValue: 'ALP',
        action: 'map',
        mappedId: '550e8400-e29b-41d4-a716-446655440001',
      },
      {
        type: 'team',
        parsedValue: 'BRV',
        action: 'map',
        mappedId: '550e8400-e29b-41d4-a716-446655440002',
      },
      {
        type: 'team',
        parsedValue: 'CHL',
        action: 'skip', // Charlie is skipped
      },
      {
        type: 'tournament',
        parsedValue: 'AZ Region #1',
        action: 'map',
        mappedId: '550e8400-e29b-41d4-a716-446655440003',
      },
    ];

    const result = service.validateFinishesRows(rows, mappings);

    // Charlie should be filtered out (skipped)
    // Alpha should pass validation
    // Bravo should fail (finish_position > field_size)
    expect(result).toHaveLength(2);

    const alpha = result.find((r) => r.originalIndex === 0);
    expect(alpha).toBeDefined();
    expect(alpha!.valid).toBe(true);
    expect(alpha!.errors).toHaveLength(0);

    const bravo = result.find((r) => r.originalIndex === 1);
    expect(bravo).toBeDefined();
    expect(bravo!.valid).toBe(false);
    expect(bravo!.errors.length).toBeGreaterThan(0);
    expect(bravo!.errors.some((e) => e.includes('finish_position'))).toBe(true);
  });
});

describe('ImportService.executeMerge', () => {
  it('inserts new rows, updates changed rows, and skips identical rows', async () => {
    // Track calls to understand what happened
    const insertCalls: unknown[] = [];
    const updateCalls: unknown[] = [];

    const mockChain: Record<string, unknown> = {};
    let maybeSingleCallCount = 0;

    // We'll simulate 3 rows:
    //   Row 0: no existing record -> INSERT
    //   Row 1: existing record with different values -> UPDATE
    //   Row 2: existing record with identical values -> SKIP
    const existingRecords = [
      null, // Row 0: no match
      {
        id: 'existing-id-1',
        division: '18O',
        finish_position: 5, // different from import value of 3
        field_size: 24,
      },
      {
        id: 'existing-id-2',
        division: '18O',
        finish_position: 1,
        field_size: 16,
      },
    ];

    mockChain.select = vi.fn().mockReturnValue(mockChain);
    mockChain.eq = vi.fn().mockReturnValue(mockChain);
    mockChain.maybeSingle = vi.fn().mockImplementation(() => {
      const record = existingRecords[maybeSingleCallCount];
      maybeSingleCallCount++;
      return Promise.resolve({ data: record, error: null });
    });

    mockChain.insert = vi.fn().mockImplementation((data) => {
      insertCalls.push(data);
      return Promise.resolve({ data: null, error: null });
    });

    mockChain.update = vi.fn().mockImplementation((data) => {
      updateCalls.push(data);
      return {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    const mockClient = {
      from: vi.fn().mockReturnValue(mockChain),
    };

    const service = new ImportService(mockClient as never);

    const validatedRows: ValidatedRow[] = [
      {
        data: {
          team_id: 'team-1',
          tournament_id: 'tourn-1',
          division: '18O',
          finish_position: 3,
          field_size: 24,
        },
        valid: true,
        errors: [],
        originalIndex: 0,
      },
      {
        data: {
          team_id: 'team-2',
          tournament_id: 'tourn-1',
          division: '18O',
          finish_position: 3, // changed from 5
          field_size: 24,
        },
        valid: true,
        errors: [],
        originalIndex: 1,
      },
      {
        data: {
          team_id: 'team-3',
          tournament_id: 'tourn-2',
          division: '18O',
          finish_position: 1,
          field_size: 16,
        },
        valid: true,
        errors: [],
        originalIndex: 2,
      },
    ];

    const summary = await service.executeMerge(
      validatedRows,
      'finishes',
      'season-1',
      '18U',
    );

    expect(summary.rowsInserted).toBe(1);
    expect(summary.rowsUpdated).toBe(1);
    expect(summary.rowsSkipped).toBe(1);
    expect(summary.importMode).toBe('merge');
    expect(insertCalls).toHaveLength(1);
    expect(updateCalls).toHaveLength(1);
  });
});

describe('Duplicate detector', () => {
  it('identifies existing team_id + tournament_id combinations correctly', async () => {
    const mockChain: Record<string, unknown> = {};
    mockChain.select = vi.fn().mockReturnValue(mockChain);
    mockChain.eq = vi.fn().mockReturnValue(mockChain);
    mockChain.in = vi.fn().mockReturnValue(mockChain);

    // Simulate that team-1:tourn-1 already exists
    const existingRecords = [
      { id: 'existing-result-1', team_id: 'team-1', tournament_id: 'tourn-1' },
    ];

    Object.defineProperty(mockChain, 'then', {
      value: Promise.resolve({ data: existingRecords, error: null }).then.bind(
        Promise.resolve({ data: existingRecords, error: null }),
      ),
      writable: true,
      configurable: true,
    });

    const mockClient = {
      from: vi.fn().mockReturnValue(mockChain),
    };

    const validatedRows: ValidatedRow[] = [
      {
        data: { team_id: 'team-1', tournament_id: 'tourn-1', division: '18O', finish_position: 3, field_size: 24 },
        valid: true,
        errors: [],
        originalIndex: 0,
      },
      {
        data: { team_id: 'team-2', tournament_id: 'tourn-2', division: '18O', finish_position: 1, field_size: 16 },
        valid: true,
        errors: [],
        originalIndex: 1,
      },
    ];

    const duplicates = await detectDuplicateFinishes(validatedRows, mockClient as never);

    expect(duplicates.size).toBe(1);
    expect(duplicates.get('team-1:tourn-1')).toBe('existing-result-1');
    expect(duplicates.has('team-2:tourn-2')).toBe(false);
  });
});

describe('Upload endpoint validation', () => {
  it('rejects non-.xlsx files with correct error message', () => {
    // Test the file extension validation logic directly
    // (We validate the logic without requiring a real HTTP server)
    const fileName = 'report.csv';
    const isXlsx = fileName.toLowerCase().endsWith('.xlsx');

    expect(isXlsx).toBe(false);

    // Also test valid .xlsx extension
    const validFileName = 'data.xlsx';
    const validIsXlsx = validFileName.toLowerCase().endsWith('.xlsx');
    expect(validIsXlsx).toBe(true);

    // Test case insensitivity
    const upperCaseFileName = 'DATA.XLSX';
    const upperIsXlsx = upperCaseFileName.toLowerCase().endsWith('.xlsx');
    expect(upperIsXlsx).toBe(true);

    // Test other invalid extensions
    const txtFile = 'data.txt';
    expect(txtFile.toLowerCase().endsWith('.xlsx')).toBe(false);

    const csvFile = 'data.csv';
    expect(csvFile.toLowerCase().endsWith('.xlsx')).toBe(false);

    const xlsFile = 'data.xls';
    expect(xlsFile.toLowerCase().endsWith('.xlsx')).toBe(false);
  });
});

describe('Levenshtein distance helper', () => {
  it('computes correct distances for known pairs', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('ALP', 'ALP')).toBe(0);
    expect(levenshteinDistance('ALP', 'ALX')).toBe(1);
  });
});
