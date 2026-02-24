<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import FileDropZone from '$lib/components/FileDropZone.svelte';
	import IdentityResolutionPanel from '$lib/components/IdentityResolutionPanel.svelte';
	import DataPreviewTable from '$lib/components/DataPreviewTable.svelte';
	import ImportSummary from '$lib/components/ImportSummary.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Select from '$lib/components/Select.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { AgeGroup } from '$lib/schemas/enums.js';
	import type {
		ImportFormat,
		ImportMode,
		ParseResult,
		ParsedFinishesRow,
		ParsedColleyRow,
		IdentityMapping,
		ImportSummaryData,
	} from '$lib/import/types.js';

	/** Server data: list of seasons */
	let { data } = $props<{
		data: {
			seasons: Array<{
				id: string;
				name: string;
				start_date: string;
				end_date: string;
				is_active: boolean;
			}>;
		};
	}>();

	// --- State Machine ---
	type Step = 'select' | 'parsing' | 'preview' | 'importing' | 'complete' | 'error';
	let step = $state<Step>('select');

	// --- Context Selectors ---
	let selectedSeasonId = $state('');
	let selectedAgeGroup = $state('');
	let selectedFormat = $state<ImportFormat>('finishes');

	// --- Parse Result State ---
	let parseResult = $state<ParseResult<ParsedFinishesRow | ParsedColleyRow> | null>(null);
	let identityMappings = $state<IdentityMapping[]>([]);
	let editedRows = new SvelteMap<string, string>();
	let skippedRowIndices = new SvelteSet<number>();
	let importMode = $state<ImportMode>('merge');
	let importSummary = $state<ImportSummaryData | null>(null);
	let errorMessage = $state('');

	// --- Available Enum Values ---
	const ageGroupOptions = AgeGroup.options;
	const formatOptions: Array<{ value: ImportFormat; label: string }> = [
		{ value: 'finishes', label: 'Finishes' },
		{ value: 'colley', label: 'Colley' },
	];

	const seasonSelectOptions = $derived(
		data.seasons.map((s: { id: string; name: string; is_active: boolean }) => ({
			value: s.id,
			label: `${s.name}${s.is_active ? ' (Active)' : ''}`,
		})),
	);

	const ageGroupSelectOptions = ageGroupOptions.map((ag) => ({
		value: ag,
		label: ag,
	}));

	const formatSelectOptions = formatOptions.map((f) => ({
		value: f.value,
		label: f.label,
	}));

	// --- Derived State ---
	let contextReady = $derived(selectedSeasonId !== '' && selectedAgeGroup !== '');

	let allConflictsResolved = $derived(() => {
		if (!parseResult) return true;
		const conflicts = parseResult.identityConflicts;
		if (conflicts.length === 0) return true;
		return conflicts.every((conflict) =>
			identityMappings.some(
				(m) => m.type === conflict.type && m.parsedValue === conflict.parsedValue,
			),
		);
	});

	let unresolvedErrorCount = $derived(() => {
		if (!parseResult) return 0;
		return parseResult.errors.filter((e) => e.severity === 'error' && !skippedRowIndices.has(e.row))
			.length;
	});

	let canConfirm = $derived(allConflictsResolved() && unresolvedErrorCount() === 0);

	// --- Actions ---
	async function handleFileDrop(file: File) {
		step = 'parsing';
		errorMessage = '';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('season_id', selectedSeasonId);
			formData.append('age_group', selectedAgeGroup);
			formData.append('format', selectedFormat);

			const response = await fetch('/api/import/upload', {
				method: 'POST',
				body: formData,
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				errorMessage = result.error || 'Upload failed. Please try again.';
				step = 'error';
				return;
			}

			parseResult = result.data;
			if (result.identityMappings) {
				identityMappings = [...result.identityMappings];
			}

			editedRows.clear();
			skippedRowIndices.clear();
			importMode = 'merge';

			step = 'preview';
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
			step = 'error';
		}
	}

	function handleResolve(mapping: IdentityMapping) {
		const existingIndex = identityMappings.findIndex(
			(m) => m.type === mapping.type && m.parsedValue === mapping.parsedValue,
		);
		if (existingIndex >= 0) {
			identityMappings[existingIndex] = mapping;
		} else {
			identityMappings = [...identityMappings, mapping];
		}
	}

	function handleEditCell(rowIndex: number, column: string, value: string) {
		const key = `${rowIndex}:${column}`;
		editedRows.set(key, value);

		if (parseResult) {
			const row = parseResult.rows[rowIndex] as unknown as Record<string, unknown>;
			if (row) {
				const numericFields = ['finishPosition', 'fieldSize', 'wins', 'losses'];
				if (numericFields.includes(column)) {
					const numVal = parseInt(value, 10);
					row[column] = isNaN(numVal) ? value : numVal;
				} else {
					row[column] = value;
				}
				parseResult = { ...parseResult, rows: [...parseResult.rows] };
			}
		}
	}

	function handleSkipRow(rowIndex: number) {
		if (skippedRowIndices.has(rowIndex)) {
			skippedRowIndices.delete(rowIndex);
		} else {
			skippedRowIndices.add(rowIndex);
		}
	}

	async function handleConfirm() {
		if (!parseResult) return;

		step = 'importing';
		errorMessage = '';

		try {
			const activeRows = parseResult.rows.filter((_, idx) => !skippedRowIndices.has(idx));

			const response = await fetch('/api/import/confirm', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rows: activeRows,
					identityMappings,
					importMode,
					seasonId: selectedSeasonId,
					ageGroup: selectedAgeGroup,
					format: selectedFormat,
				}),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				errorMessage = result.error || 'Import failed. Please try again.';
				step = 'error';
				return;
			}

			importSummary = result.summary;
			step = 'complete';
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'An unexpected error occurred during import.';
			step = 'error';
		}
	}

	function handleReset() {
		step = 'select';
		parseResult = null;
		identityMappings = [];
		editedRows.clear();
		skippedRowIndices.clear();
		importMode = 'merge';
		importSummary = null;
		errorMessage = '';
	}

	function handleCancel() {
		handleReset();
	}
</script>

<PageHeader
	title="Import Data"
	subtitle="Upload Excel spreadsheets to import tournament results or ranking data."
/>

<div class="space-y-6">
	{#if step === 'error'}
		<Banner variant="error" title="Import Error">
			<p class="whitespace-pre-wrap">{errorMessage}</p>
			<div class="mt-4">
				<Button variant="danger" onclick={handleReset}>Try Again</Button>
			</div>
		</Banner>
	{/if}

	{#if step === 'complete' && importSummary}
		<ImportSummary summary={importSummary} onReset={handleReset} />
	{/if}

	{#if step !== 'complete' && step !== 'error'}
		<Card>
			{#snippet header()}
				<h2 class="text-lg font-semibold text-text-primary">Import Settings</h2>
			{/snippet}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<Select
					label="Season"
					id="season-select"
					options={seasonSelectOptions}
					bind:value={selectedSeasonId}
					placeholder="Select a season..."
					disabled={step !== 'select'}
				/>
				<Select
					label="Age Group"
					id="age-group-select"
					options={ageGroupSelectOptions}
					bind:value={selectedAgeGroup}
					placeholder="Select age group..."
					disabled={step !== 'select'}
				/>
				<Select
					label="Format"
					id="format-select"
					options={formatSelectOptions}
					bind:value={selectedFormat}
					disabled={step !== 'select'}
				/>
			</div>
		</Card>

		{#if step === 'select' || step === 'parsing'}
			<FileDropZone
				accept=".xlsx"
				maxSizeMB={10}
				disabled={step === 'parsing' || !contextReady}
				processing={step === 'parsing'}
				onFileDrop={handleFileDrop}
			/>

			{#if !contextReady && step === 'select'}
				<p class="text-center text-sm text-warning">
					Please select a season and age group before uploading a file.
				</p>
			{/if}
		{/if}

		{#if step === 'preview' && parseResult}
			{#if parseResult.identityConflicts.length > 0}
				<IdentityResolutionPanel
					conflicts={parseResult.identityConflicts}
					onResolve={handleResolve}
				/>
			{/if}

			<DataPreviewTable
				rows={parseResult.rows as unknown as Record<string, unknown>[]}
				errors={parseResult.errors}
				format={selectedFormat}
				skippedIndices={skippedRowIndices}
				onEditCell={handleEditCell}
				onSkipRow={handleSkipRow}
			/>

			<Card>
				{#snippet header()}
					<h3 class="text-lg font-semibold text-text-primary">Import Mode</h3>
				{/snippet}
				<div class="flex items-center gap-6">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="import-mode"
							value="merge"
							bind:group={importMode}
							class="h-4 w-4 text-accent focus:ring-accent"
						/>
						<span class="text-sm font-medium text-text-secondary">Merge/Update</span>
						<span class="text-xs text-text-muted">(insert new, update changed, skip identical)</span
						>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="import-mode"
							value="replace"
							bind:group={importMode}
							class="h-4 w-4 text-accent focus:ring-accent"
						/>
						<span class="text-sm font-medium text-text-secondary">Replace All</span>
						<span class="text-xs text-text-muted">(delete existing, insert all new)</span>
					</label>
				</div>
			</Card>

			<div class="flex items-center justify-between">
				<Button variant="secondary" onclick={handleCancel}>Cancel</Button>
				<Button variant="primary" disabled={!canConfirm} onclick={handleConfirm}
					>Confirm Import</Button
				>
			</div>
		{/if}

		{#if step === 'importing'}
			<Card>
				<div class="flex items-center justify-center py-8">
					<div class="flex items-center gap-3 text-text-secondary">
						<Spinner />
						<span class="text-lg font-medium">Importing data...</span>
					</div>
				</div>
			</Card>
		{/if}
	{/if}
</div>
