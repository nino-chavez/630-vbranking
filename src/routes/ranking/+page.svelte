<script lang="ts">
	import RankingResultsTable from '$lib/components/RankingResultsTable.svelte';
	import OverridePanel from '$lib/components/OverridePanel.svelte';
	import ExportDropdown from '$lib/components/ExportDropdown.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Select from '$lib/components/Select.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
	import { AgeGroup } from '$lib/schemas/enums.js';
	import { formatTimestamp } from '$lib/utils/format.js';
	import { assembleExportRows } from '$lib/export/export-data.js';
	import type { ExportMetadata } from '$lib/export/types.js';
	import type { NormalizedTeamResult } from '$lib/ranking/types.js';
	import type { OverrideData } from '$lib/ranking/table-utils.js';

	/** Server data: list of seasons */
	let { data } = $props<{
		data: {
			seasons: Array<{ id: string; name: string }>;
		};
	}>();

	// --- State Machine ---
	type Step = 'idle' | 'running' | 'results' | 'error';
	let step = $state<Step>('idle');

	// --- Context Selectors ---
	let selectedSeasonId = $state('');
	let selectedAgeGroup = $state('');

	// --- Results State ---
	let rankingResults = $state<NormalizedTeamResult[]>([]);
	let teams = $state<Record<string, { name: string; region: string }>>({});
	let seedingFactors = $state<
		Record<
			string,
			{
				win_pct: number;
				best_national_finish: number | null;
				best_national_tournament_name: string | null;
			}
		>
	>({});
	let runSummary = $state<{
		ranking_run_id: string;
		teams_ranked: number;
		ran_at: string;
	} | null>(null);
	let errorMessage = $state('');

	// --- Override State ---
	let overrides = $state<Record<string, OverrideData>>({});
	let runStatus = $state<'draft' | 'finalized'>('draft');

	// --- Override Panel State ---
	let panelOpen = $state(false);
	let panelTeamId = $state('');
	let panelTeamName = $state('');
	let panelOriginalRank = $state(0);
	let finalizingRun = $state(false);

	// --- Run History State ---
	let previousRuns = $state<
		Array<{
			id: string;
			ran_at: string;
			teams_ranked: number;
			status: 'draft' | 'finalized';
			age_group: string;
		}>
	>([]);
	let selectedRunId = $state('');
	let loadingRun = $state(false);

	// --- Available Options ---
	const ageGroupOptions = AgeGroup.options;

	const seasonSelectOptions = $derived(
		data.seasons.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })),
	);

	const ageGroupSelectOptions = ageGroupOptions.map((ag) => ({
		value: ag,
		label: ag,
	}));

	const runSelectOptions = $derived(
		previousRuns.map((r) => ({
			value: r.id,
			label: `${formatTimestamp(r.ran_at)} \u2014 ${r.age_group} \u2014 ${r.teams_ranked} teams${r.status === 'finalized' ? ' (Finalized)' : ''}`,
		})),
	);

	// --- Derived State ---
	let contextReady = $derived(selectedSeasonId !== '' && selectedAgeGroup !== '');

	const hasOverrides = $derived(Object.keys(overrides).length > 0);
	const panelExistingOverride = $derived(
		panelTeamId && overrides[panelTeamId] ? overrides[panelTeamId] : null,
	);

	// --- Export Derived State ---
	const exportRows = $derived(
		step === 'results'
			? assembleExportRows(rankingResults, teams, seedingFactors, overrides, {
					includeAlgorithmBreakdowns: true,
				})
			: [],
	);

	const selectedSeasonName = $derived(
		data.seasons.find((s: { id: string; name: string }) => s.id === selectedSeasonId)?.name ?? '',
	);

	const exportMetadata: ExportMetadata = $derived({
		season_name: selectedSeasonName,
		age_group: selectedAgeGroup,
		ran_at: runSummary?.ran_at ?? '',
		teams_ranked: runSummary?.teams_ranked ?? 0,
		run_status: runStatus,
		exported_at: new Date().toISOString(),
	});

	// --- Actions ---
	async function handleRunRankings() {
		step = 'running';
		errorMessage = '';

		try {
			const response = await fetch('/api/ranking/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					season_id: selectedSeasonId,
					age_group: selectedAgeGroup,
				}),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				errorMessage = result.error || 'Ranking run failed. Please try again.';
				step = 'error';
				return;
			}

			runSummary = result.data;
			selectedRunId = result.data.ranking_run_id;

			// Extract seeding factors from the run response
			if (result.data.seeding_factors) {
				seedingFactors = result.data.seeding_factors;
			}

			// Fetch full results
			await loadRunResults(result.data.ranking_run_id);

			// Fetch run history
			await loadRunHistory();

			step = 'results';
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
			step = 'error';
		}
	}

	async function loadRunResults(runId: string) {
		const resultsResponse = await fetch(`/api/ranking/results?ranking_run_id=${runId}`);

		if (resultsResponse.ok) {
			const resultsData = await resultsResponse.json();
			if (resultsData.success) {
				rankingResults = resultsData.data.results;
				teams = resultsData.data.teams;
				overrides = resultsData.data.overrides ?? {};
				runStatus = resultsData.data.run_status ?? 'draft';
			}
		}
	}

	async function loadRunHistory() {
		if (!selectedSeasonId || !selectedAgeGroup) return;

		const response = await fetch(
			`/api/ranking/runs?season_id=${selectedSeasonId}&age_group=${selectedAgeGroup}`,
		);

		if (response.ok) {
			const data = await response.json();
			if (data.success) {
				previousRuns = data.data.runs;
			}
		}
	}

	async function handleRunSelect() {
		if (!selectedRunId || loadingRun) return;

		loadingRun = true;
		try {
			await loadRunResults(selectedRunId);

			// Update run summary
			const run = previousRuns.find((r) => r.id === selectedRunId);
			if (run) {
				runSummary = {
					ranking_run_id: run.id,
					teams_ranked: run.teams_ranked,
					ran_at: run.ran_at,
				};
			}

			// Clear seeding factors for historical runs (only available from run API)
			seedingFactors = {};
		} finally {
			loadingRun = false;
		}
	}

	function handleReset() {
		step = 'idle';
		rankingResults = [];
		teams = {};
		seedingFactors = {};
		runSummary = null;
		errorMessage = '';
		previousRuns = [];
		selectedRunId = '';
		overrides = {};
		runStatus = 'draft';
		panelOpen = false;
	}

	// --- Override Panel Handlers ---
	function handleOverrideClick(teamId: string, teamName: string, aggRank: number) {
		panelTeamId = teamId;
		panelTeamName = teamName;
		panelOriginalRank = aggRank;
		panelOpen = true;
	}

	async function handleOverrideSave(formData: {
		final_rank: number;
		justification: string;
		committee_member: string;
	}) {
		if (!runSummary) return;

		const response = await fetch('/api/ranking/overrides', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ranking_run_id: runSummary.ranking_run_id,
				team_id: panelTeamId,
				original_rank: panelOriginalRank,
				final_rank: formData.final_rank,
				justification: formData.justification,
				committee_member: formData.committee_member,
			}),
		});

		if (response.ok) {
			const result = await response.json();
			if (result.success) {
				// Update local overrides state
				overrides = {
					...overrides,
					[panelTeamId]: {
						original_rank: panelOriginalRank,
						final_rank: formData.final_rank,
						justification: formData.justification,
						committee_member: formData.committee_member,
					},
				};
				panelOpen = false;
			}
		}
	}

	async function handleOverrideRemove() {
		if (!runSummary) return;

		const response = await fetch(
			`/api/ranking/overrides?ranking_run_id=${runSummary.ranking_run_id}&team_id=${panelTeamId}`,
			{ method: 'DELETE' },
		);

		if (response.ok) {
			const result = await response.json();
			if (result.success) {
				const updated = { ...overrides };
				delete updated[panelTeamId];
				overrides = updated;
				panelOpen = false;
			}
		}
	}

	async function handleFinalizeRun() {
		if (!runSummary || finalizingRun) return;

		finalizingRun = true;
		try {
			const response = await fetch('/api/ranking/runs/finalize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ranking_run_id: runSummary.ranking_run_id }),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.success) {
					runStatus = 'finalized';
					// Update the run in history list
					previousRuns = previousRuns.map((r) =>
						r.id === runSummary!.ranking_run_id ? { ...r, status: 'finalized' as const } : r,
					);
				}
			}
		} finally {
			finalizingRun = false;
		}
	}
</script>

<PageHeader
	title="Rankings"
	subtitle="Run ranking algorithms to compute team ratings and aggregate rankings."
/>

<div class="space-y-6">
	{#if step === 'error'}
		<Banner variant="error" title="Ranking Error">
			<p class="whitespace-pre-wrap">{errorMessage}</p>
			<div class="mt-4">
				<Button variant="danger" onclick={handleReset}>Try Again</Button>
			</div>
		</Banner>
	{/if}

	{#if step === 'results'}
		{#if runStatus === 'finalized'}
			<Banner variant="info" title="Finalized">
				This ranking run has been finalized. Overrides are locked and cannot be modified.
			</Banner>
		{/if}

		{#if runSummary}
			<Banner variant="success">
				<div class="flex items-center gap-3">
					<span>Ranked {runSummary.teams_ranked} teams</span>
					<FreshnessIndicator timestamp={runSummary.ran_at} />
				</div>
			</Banner>
		{/if}

		<!-- Run History Selector -->
		{#if previousRuns.length > 1}
			<div class="flex items-end gap-4">
				<div class="w-full max-w-md">
					<Select
						label="Previous Runs"
						id="run-history-select"
						options={runSelectOptions}
						bind:value={selectedRunId}
						onchange={handleRunSelect}
					/>
				</div>
				{#if loadingRun}
					<p class="pb-2 text-sm text-text-muted">Loading...</p>
				{/if}
			</div>
		{/if}

		<RankingResultsTable
			results={rankingResults}
			{teams}
			{seedingFactors}
			rankingRunId={runSummary?.ranking_run_id ?? ''}
			{overrides}
			{runStatus}
			onoverrideclick={handleOverrideClick}
		/>

		<!-- Export / Finalize / Run Again controls -->
		<div class="flex items-center justify-end gap-3">
			<ExportDropdown
				rows={exportRows}
				metadata={exportMetadata}
				{overrides}
				{teams}
				ageGroup={selectedAgeGroup}
			/>
			{#if runStatus === 'draft' && hasOverrides}
				<Button variant="primary" loading={finalizingRun} onclick={handleFinalizeRun}
					>Finalize Run</Button
				>
			{/if}
			<Button
				variant={runStatus === 'draft' && hasOverrides ? 'secondary' : 'primary'}
				onclick={handleReset}>Run Again</Button
			>
		</div>
	{/if}

	{#if step === 'idle' || step === 'running'}
		<Card>
			{#snippet header()}
				<h2 class="text-lg font-semibold text-text-primary">Ranking Settings</h2>
			{/snippet}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Select
					label="Season"
					id="ranking-season-select"
					options={seasonSelectOptions}
					bind:value={selectedSeasonId}
					placeholder="Select a season..."
					disabled={step === 'running'}
				/>
				<Select
					label="Age Group"
					id="ranking-age-group-select"
					options={ageGroupSelectOptions}
					bind:value={selectedAgeGroup}
					placeholder="Select age group..."
					disabled={step === 'running'}
				/>
			</div>

			<div class="mt-6">
				<Button
					variant="primary"
					disabled={!contextReady || step === 'running'}
					loading={step === 'running'}
					onclick={handleRunRankings}
				>
					{step === 'running' ? 'Running...' : 'Run Rankings'}
				</Button>
			</div>
		</Card>

		{#if !contextReady && step === 'idle'}
			<p class="text-center text-sm text-warning">
				Please select a season and age group before running rankings.
			</p>
		{/if}
	{/if}
</div>

<!-- Override Panel -->
<OverridePanel
	open={panelOpen}
	teamName={panelTeamName}
	teamId={panelTeamId}
	originalRank={panelOriginalRank}
	{runStatus}
	existingOverride={panelExistingOverride}
	onsave={handleOverrideSave}
	onremove={handleOverrideRemove}
	onclose={() => (panelOpen = false)}
/>
