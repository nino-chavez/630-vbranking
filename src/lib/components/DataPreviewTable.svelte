<script lang="ts">
	import type { ParseError, ImportFormat } from '$lib/import/types.js';

	type ParsedRow = Record<string, unknown>;

	let {
		rows,
		errors,
		format = 'finishes',
		skippedIndices = new Set<number>(),
		onEditCell,
		onSkipRow,
	} = $props<{
		rows: ParsedRow[];
		errors: ParseError[];
		format?: ImportFormat;
		skippedIndices?: Set<number>;
		onEditCell: (rowIndex: number, column: string, value: string) => void;
		onSkipRow: (rowIndex: number) => void;
	}>();

	let editingCell = $state<string | null>(null);
	let editValue = $state('');

	function getRowErrors(rowIndex: number): ParseError[] {
		return errors.filter((e: ParseError) => e.row === rowIndex);
	}

	function hasErrors(rowIndex: number): boolean {
		return getRowErrors(rowIndex).length > 0;
	}

	let errorRowCount = $derived(
		rows.reduce((count: number, _: ParsedRow, idx: number) => {
			if (skippedIndices.has(idx)) return count;
			return count + (hasErrors(idx) ? 1 : 0);
		}, 0),
	);

	let totalErrorCount = $derived(
		errors.filter((e: ParseError) => !skippedIndices.has(e.row)).length,
	);

	let activeRowCount = $derived(rows.length - skippedIndices.size);

	let columns = $derived(
		format === 'finishes'
			? [
					{ key: 'teamName', label: 'Team', editable: false },
					{ key: 'tournamentName', label: 'Tournament', editable: false },
					{ key: 'division', label: 'Div', editable: true },
					{ key: 'finishPosition', label: 'Fin', editable: true },
					{ key: 'fieldSize', label: 'Tot', editable: true },
				]
			: [
					{ key: 'teamName', label: 'Team', editable: false },
					{ key: 'teamCode', label: 'Code', editable: false },
					{ key: 'wins', label: 'Wins', editable: false },
					{ key: 'losses', label: 'Losses', editable: false },
					{ key: 'algo1Rating', label: 'A1 Rate', editable: false },
					{ key: 'algo1Rank', label: 'A1 Rank', editable: false },
					{ key: 'aggRating', label: 'Agg Rate', editable: false },
					{ key: 'aggRank', label: 'Agg Rank', editable: false },
				],
	);

	function startEdit(rowIndex: number, column: string, currentValue: unknown) {
		editingCell = `${rowIndex}:${column}`;
		editValue = String(currentValue ?? '');
	}

	function commitEdit(rowIndex: number, column: string) {
		if (editingCell === `${rowIndex}:${column}`) {
			onEditCell(rowIndex, column, editValue);
			editingCell = null;
			editValue = '';
		}
	}

	function handleEditKeyDown(event: KeyboardEvent, rowIndex: number, column: string) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitEdit(rowIndex, column);
		} else if (event.key === 'Escape') {
			editingCell = null;
			editValue = '';
		}
	}

	function getCellValue(row: ParsedRow, key: string): unknown {
		return row[key];
	}

	function getErrorMessage(rowIndex: number): string {
		const rowErrors = getRowErrors(rowIndex);
		return rowErrors.map((e) => `${e.column}: ${e.message}`).join('; ');
	}
</script>

<div class="rounded-lg border border-border bg-surface shadow-sm">
	<div class="flex items-center justify-between border-b border-border px-6 py-4">
		<h3 class="text-lg font-semibold text-text-primary">Data Preview</h3>
		<div class="flex items-center gap-3">
			{#if totalErrorCount > 0}
				<span
					class="inline-flex items-center rounded-full bg-error-light px-3 py-1 text-sm font-medium text-red-800"
				>
					{totalErrorCount} error{totalErrorCount !== 1 ? 's' : ''} in {errorRowCount} row{errorRowCount !==
					1
						? 's'
						: ''}
				</span>
			{/if}
			<span class="text-sm text-text-muted">
				{activeRowCount} row{activeRowCount !== 1 ? 's' : ''} active
			</span>
		</div>
	</div>

	<div class="max-h-96 overflow-auto">
		<table class="min-w-full divide-y divide-border">
			<thead class="sticky top-0 bg-surface-alt">
				<tr>
					<th
						scope="col"
						class="w-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted"
					>
						#
					</th>
					{#each columns as col (col.key)}
						<th
							scope="col"
							class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted"
						>
							{col.label}
						</th>
					{/each}
					<th
						scope="col"
						class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted"
					>
						Status
					</th>
					<th
						scope="col"
						class="w-16 px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
					>
						Skip
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border bg-surface">
				{#each rows as row, rowIndex (rowIndex)}
					{@const isSkipped = skippedIndices.has(rowIndex)}
					{@const rowHasErrors = hasErrors(rowIndex)}
					<tr
						class={isSkipped
							? 'bg-surface-alt'
							: rowHasErrors
								? 'border-l-4 border-error bg-error-light'
								: 'hover:bg-surface-alt'}
					>
						<td class="whitespace-nowrap px-3 py-2 text-sm text-text-muted">
							{rowIndex + 1}
						</td>

						{#each columns as col (col.key)}
							<td
								class="whitespace-nowrap px-3 py-2 text-sm
                  {isSkipped ? 'text-text-muted line-through' : 'text-text-primary'}"
							>
								{#if col.editable && editingCell === `${rowIndex}:${col.key}` && !isSkipped}
									<input
										type="text"
										class="w-20 rounded border border-accent px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
										bind:value={editValue}
										onblur={() => commitEdit(rowIndex, col.key)}
										onkeydown={(e) => handleEditKeyDown(e, rowIndex, col.key)}
									/>
								{:else if col.editable && !isSkipped}
									<button
										type="button"
										class="cursor-text rounded px-1 py-0.5 text-left hover:bg-accent-light hover:ring-1 hover:ring-accent"
										onclick={() => startEdit(rowIndex, col.key, getCellValue(row, col.key))}
										title="Click to edit"
									>
										{getCellValue(row, col.key) ?? ''}
									</button>
								{:else}
									{getCellValue(row, col.key) ?? ''}
								{/if}
							</td>
						{/each}

						<td class="whitespace-nowrap px-3 py-2 text-sm">
							{#if isSkipped}
								<span class="text-text-muted">Skipped</span>
							{:else if rowHasErrors}
								<span class="inline-flex items-center gap-1 text-red-700">
									<svg
										class="h-4 w-4 flex-shrink-0"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
											clip-rule="evenodd"
										/>
									</svg>
									<span title={getErrorMessage(rowIndex)}>
										ERROR: {getRowErrors(rowIndex)[0]?.message ?? 'Validation error'}
									</span>
								</span>
							{:else}
								<span class="text-success">OK</span>
							{/if}
						</td>

						<td class="px-3 py-2 text-center">
							<button
								type="button"
								class="rounded p-1 text-text-muted hover:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
								onclick={() => onSkipRow(rowIndex)}
								title={isSkipped ? 'Include row' : 'Skip row'}
								aria-label={isSkipped ? `Include row ${rowIndex + 1}` : `Skip row ${rowIndex + 1}`}
							>
								<svg
									class="h-5 w-5"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
									/>
								</svg>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if rows.length === 0}
		<div class="px-6 py-8 text-center text-sm text-text-muted">No data rows to preview.</div>
	{/if}
</div>
