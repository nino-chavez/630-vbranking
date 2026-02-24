import { describe, it, expect, vi } from 'vitest';
import { ImportService } from '../import-service.js';
import type { ValidatedRow } from '../import-service.js';

/**
 * Import Mode Edge Case Tests (Task Group 4, Sub-task 4.4)
 *
 * Test 7: Merge idempotency -- identical existing data produces 0 inserts,
 *         0 updates, and all rows skipped.
 * Test 8: Replace mode propagates RPC errors correctly.
 */

describe('ImportService.executeMerge: idempotency', () => {
	it('produces 0 inserts, 0 updates, all skipped when existing data is identical', async () => {
		// Arrange: mock Supabase that returns identical existing records for every row
		const mockChain: Record<string, unknown> = {};

		// We have 3 validated rows. Each will be looked up and found identical.
		const existingRecords = [
			{
				id: 'existing-id-1',
				division: '18O',
				finish_position: 3,
				field_size: 24,
			},
			{
				id: 'existing-id-2',
				division: '18O',
				finish_position: 1,
				field_size: 16,
			},
			{
				id: 'existing-id-3',
				division: '16O',
				finish_position: 5,
				field_size: 20,
			},
		];

		let maybeSingleCallCount = 0;

		mockChain.select = vi.fn().mockReturnValue(mockChain);
		mockChain.eq = vi.fn().mockReturnValue(mockChain);
		mockChain.maybeSingle = vi.fn().mockImplementation(() => {
			const record = existingRecords[maybeSingleCallCount];
			maybeSingleCallCount++;
			return Promise.resolve({ data: record, error: null });
		});

		// insert and update should NOT be called
		mockChain.insert = vi.fn().mockImplementation(() => {
			return Promise.resolve({ data: null, error: null });
		});
		mockChain.update = vi.fn().mockImplementation(() => {
			return {
				eq: vi.fn().mockResolvedValue({ data: null, error: null }),
			};
		});

		const mockClient = {
			from: vi.fn().mockReturnValue(mockChain),
		};

		const service = new ImportService(mockClient as never);

		// The validated rows have exactly the same data as the existing records
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
					tournament_id: 'tourn-2',
					division: '18O',
					finish_position: 1,
					field_size: 16,
				},
				valid: true,
				errors: [],
				originalIndex: 1,
			},
			{
				data: {
					team_id: 'team-3',
					tournament_id: 'tourn-3',
					division: '16O',
					finish_position: 5,
					field_size: 20,
				},
				valid: true,
				errors: [],
				originalIndex: 2,
			},
		];

		// Act
		const summary = await service.executeMerge(validatedRows, 'finishes', 'season-1', '18U');

		// Assert: all rows skipped, none inserted or updated
		expect(summary.rowsInserted).toBe(0);
		expect(summary.rowsUpdated).toBe(0);
		expect(summary.rowsSkipped).toBe(3);
		expect(summary.importMode).toBe('merge');

		// Verify insert and update were never called
		expect(mockChain.insert).not.toHaveBeenCalled();
		expect(mockChain.update).not.toHaveBeenCalled();
	});
});

describe('ImportService.executeReplace: error propagation', () => {
	it('propagates RPC error correctly and does not silently eat errors', async () => {
		// Arrange: mock Supabase where the RPC call returns an error
		const rpcError = {
			data: null,
			error: { message: 'Permission denied: insufficient privileges' },
		};

		const mockClient = {
			from: vi.fn(),
			rpc: vi.fn().mockResolvedValue(rpcError),
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
		];

		// Act & Assert: the error is propagated as a thrown exception
		await expect(
			service.executeReplace(validatedRows, 'season-1', '18U', 'finishes'),
		).rejects.toThrow('Replace import failed');

		await expect(
			service.executeReplace(validatedRows, 'season-1', '18U', 'finishes'),
		).rejects.toThrow('Permission denied');

		// Verify the RPC was called with the correct function name
		expect(mockClient.rpc).toHaveBeenCalledWith(
			'import_replace_tournament_results',
			expect.objectContaining({
				p_season_id: 'season-1',
				p_age_group: '18U',
			}),
		);
	});
});
