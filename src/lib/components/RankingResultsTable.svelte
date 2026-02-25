<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { NormalizedTeamResult } from '$lib/ranking/types.js';
	import {
		sortResults,
		filterResults,
		computeFinalRanks,
		type SortKey,
		type SortDirection,
		type OverrideData,
	} from '$lib/ranking/table-utils.js';
	import { toOrdinal } from '$lib/utils/format.js';
	import DataTable from './DataTable.svelte';
	import TierRow from './TierRow.svelte';
	import RankBadge from './RankBadge.svelte';
	import RankMovement from './RankMovement.svelte';
	import Select from './Select.svelte';

	interface SeedingData {
		win_pct: number;
		best_national_finish: number | null;
		best_national_tournament_name: string | null;
	}

	let {
		results,
		teams,
		seedingFactors = {},
		rankingRunId = '',
		overrides = {},
		previousRanks = {},
		initialSearch = '',
		initialRegion = '',
		onfilterchange,
		runStatus: _runStatus = 'draft',
		onoverrideclick,
	}: {
		results: NormalizedTeamResult[];
		teams: Record<string, { name: string; code?: string; region: string }>;
		seedingFactors?: Record<string, SeedingData>;
		rankingRunId?: string;
		overrides?: Record<string, OverrideData>;
		previousRanks?: Record<string, number>;
		initialSearch?: string;
		initialRegion?: string;
		onfilterchange?: (search: string, region: string) => void;
		runStatus?: 'draft' | 'finalized';
		onoverrideclick?: (teamId: string, teamName: string, aggRank: number) => void;
	} = $props();

	// --- Sorting State ---
	const hasOverrides = $derived(Object.keys(overrides).length > 0);
	let sortKey = $state<SortKey>('agg_rank');
	let sortDirection = $state<SortDirection>('asc');
	let showAlgoDetails = $state(false);
	const algoColClass = $derived(showAlgoDetails ? 'hidden sm:table-cell' : 'hidden');

	// Switch default sort to final_rank when overrides exist
	$effect(() => {
		if (hasOverrides && sortKey === 'agg_rank') {
			sortKey = 'final_rank';
		}
	});

	// --- Filter State (bindable for URL param sync) ---
	let searchText = $state(initialSearch ?? '');
	let regionFilter = $state(initialRegion ?? '');

	// --- Derived ---
	const hasSeedingData = $derived(Object.keys(seedingFactors).length > 0);
	const hasPreviousRanks = $derived(Object.keys(previousRanks).length > 0);

	const uniqueRegions = $derived(() => {
		const regions = new SvelteSet<string>();
		for (const t of Object.values(teams)) {
			if (t.region) regions.add(t.region);
		}
		return [...regions].sort();
	});

	const regionCounts = $derived(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Map used as local computation, not reactive state
		const counts = new Map<string, number>();
		for (const r of results) {
			const region = teams[r.team_id]?.region;
			if (region) counts.set(region, (counts.get(region) ?? 0) + 1);
		}
		return counts;
	});

	const regionOptions = $derived(
		uniqueRegions().map((r) => ({
			value: r,
			label: `${r} (${regionCounts().get(r) ?? 0})`,
		})),
	);

	const finalRanks = $derived(hasOverrides ? computeFinalRanks(results, overrides) : {});

	const filteredAndSorted = $derived(() => {
		const filtered = filterResults(results, teams, searchText, regionFilter);
		return sortResults(
			filtered,
			teams,
			seedingFactors,
			sortKey,
			sortDirection,
			hasOverrides ? overrides : undefined,
		);
	});

	const displayResults = $derived(filteredAndSorted());
	const isFiltered = $derived(searchText !== '' || regionFilter !== '');

	// Notify parent of filter changes for URL sync
	$effect(() => {
		onfilterchange?.(searchText, regionFilter);
	});

	// --- Actions ---
	function handleSort(key: SortKey) {
		if (sortKey === key) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDirection = key === 'agg_rating' || key === 'win_pct' ? 'desc' : 'asc';
		}
	}

	function sortArrow(key: SortKey): string {
		if (sortKey !== key) return '';
		return sortDirection === 'asc' ? ' \u2191' : ' \u2193';
	}

	function ariaSortValue(key: SortKey): 'ascending' | 'descending' | 'none' {
		if (sortKey !== key) return 'none';
		return sortDirection === 'asc' ? 'ascending' : 'descending';
	}

	function fmt(value: number): string {
		return value.toFixed(2);
	}

	function teamName(teamId: string): string {
		return teams[teamId]?.name ?? teamId;
	}

	function teamCode(teamId: string): string | undefined {
		return teams[teamId]?.code;
	}

	function handleOverrideClick(teamId: string) {
		if (onoverrideclick) {
			onoverrideclick(
				teamId,
				teamName(teamId),
				results.find((r) => r.team_id === teamId)?.agg_rank ?? 0,
			);
		}
	}
</script>

{#if results.length === 0}
	<div class="rounded-xl bg-surface p-12 text-center shadow-md">
		<p class="text-text-muted">No results</p>
	</div>
{:else}
	<!-- Filter Controls -->
	<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
		<div class="flex-1">
			<label for="ranking-search" class="mb-1 block text-sm font-medium text-text-secondary"
				>Search</label
			>
			<input
				id="ranking-search"
				type="text"
				placeholder="Search by team name or code..."
				aria-label="Search teams by name or code"
				class="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary placeholder-text-muted shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
				bind:value={searchText}
			/>
		</div>
		<div class="w-full sm:w-48">
			<Select
				label="Region"
				id="ranking-region-filter"
				options={regionOptions}
				bind:value={regionFilter}
				placeholder="All Regions"
			/>
		</div>
		<button
			type="button"
			class="hidden min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium text-text-secondary hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent/20 sm:inline-flex"
			onclick={() => (showAlgoDetails = !showAlgoDetails)}
		>
			{#if showAlgoDetails}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
				Hide Algorithm Details
			{:else}
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
				Show Algorithm Details
			{/if}
		</button>
	</div>

	{#if isFiltered}
		<div class="mb-2 flex items-center gap-3">
			<p class="text-sm text-text-muted">
				Showing {displayResults.length} of {results.length} teams
			</p>
			<button
				type="button"
				class="rounded px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus:outline-none focus:ring-1 focus:ring-accent"
				onclick={() => { searchText = ''; regionFilter = ''; }}
			>
				Clear filters
			</button>
		</div>
	{/if}

	<DataTable caption="Ranking results">
		<thead class="bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-white">
			<tr>
				{#if hasOverrides}
					<th
						scope="col"
						class="cursor-pointer select-none px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
						aria-sort={ariaSortValue('final_rank')}
						onclick={() => handleSort('final_rank')}>Final Seed{sortArrow('final_rank')}</th
					>
				{/if}
				<th
					scope="col"
					class="cursor-pointer select-none px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
					aria-sort={ariaSortValue('agg_rank')}
					onclick={() => handleSort('agg_rank')}
					>{hasOverrides ? 'Algo Rank' : 'Rank'}{sortArrow('agg_rank')}</th
				>
				<th
					scope="col"
					class="cursor-pointer select-none px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
					aria-sort={ariaSortValue('team_name')}
					onclick={() => handleSort('team_name')}>Team Name{sortArrow('team_name')}</th
				>
				{#if hasSeedingData}
					<th
						scope="col"
						class="cursor-pointer select-none px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
						title="Win percentage vs. all opponents across all tournaments"
						aria-sort={ariaSortValue('win_pct')}
						onclick={() => handleSort('win_pct')}>W%{sortArrow('win_pct')}</th
					>
					<th
						scope="col"
						class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
						title="Best finish at a Tier-1 (National Championship) tournament">Natl. Finish</th
					>
				{/if}
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70"
					>Colley Rating</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
					>Colley Rank</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2200 Rating</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2200 Rank</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2400 Rating</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2400 Rank</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2500 Rating</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2500 Rank</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2700 Rating</th
				>
				<th
					scope="col"
					class="{algoColClass} px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
					>Elo-2700 Rank</th
				>
				<th
					scope="col"
					class="cursor-pointer select-none px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white"
					aria-sort={ariaSortValue('agg_rating')}
					onclick={() => handleSort('agg_rating')}>AggRating{sortArrow('agg_rating')}</th
				>
				{#if onoverrideclick}
					<th
						scope="col"
						class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70"
						>Override</th
					>
				{/if}
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each displayResults as row (row.team_id)}
				{@const hasOverride = row.team_id in overrides}
				<TierRow rank={hasOverrides ? (finalRanks[row.team_id] ?? row.agg_rank) : row.agg_rank}>
					{#if hasOverrides}
						<td class="whitespace-nowrap px-3 py-2 text-center">
							<RankBadge rank={finalRanks[row.team_id] ?? row.agg_rank} />
							{#if hasOverride}
								<span
									class="ml-1 inline-flex items-center rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent"
									title="Committee override applied">ADJ</span
								>
							{/if}
						</td>
					{/if}
					<td
						class="whitespace-nowrap px-3 py-2 text-center {hasOverrides
							? 'text-sm text-text-muted'
							: ''}"
					>
						{#if hasOverrides}
							{row.agg_rank}
						{:else}
							<span class="inline-flex items-center gap-1.5">
								<RankBadge rank={row.agg_rank} />
								{#if hasPreviousRanks}
									<RankMovement
										currentRank={row.agg_rank}
										previousRank={previousRanks[row.team_id] ?? null}
									/>
								{/if}
							</span>
						{/if}
					</td>
					<td class="whitespace-nowrap px-3 py-2 text-left text-sm text-text-primary">
						{#if rankingRunId}
							<a
								href="/ranking/team/{row.team_id}?run_id={rankingRunId}"
								class="font-medium text-accent underline-offset-2 hover:underline focus:outline-none focus:ring-1 focus:ring-accent rounded"
								>{teamName(row.team_id)}</a
							>
						{:else}
							<span class="font-medium">{teamName(row.team_id)}</span>
						{/if}
						{#if teamCode(row.team_id)}
							<span class="ml-1.5 text-xs text-text-muted">{teamCode(row.team_id)}</span>
						{/if}
					</td>
					{#if hasSeedingData}
						{@const sf = seedingFactors[row.team_id]}
						<td
							class="whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
							>{sf ? `${sf.win_pct.toFixed(1)}%` : '---'}</td
						>
						<td class="whitespace-nowrap px-3 py-2 text-center text-sm text-text-secondary"
							>{sf?.best_national_finish != null ? toOrdinal(sf.best_national_finish) : 'N/A'}</td
						>
					{/if}
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
						>{fmt(row.algo1_rating)}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted"
						>{row.algo1_rank}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
						>{fmt(row.algo2_rating)}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted"
						>{row.algo2_rank}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
						>{fmt(row.algo3_rating)}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted"
						>{row.algo3_rank}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
						>{fmt(row.algo4_rating)}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted"
						>{row.algo4_rank}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary"
						>{fmt(row.algo5_rating)}</td
					>
					<td
						class="{algoColClass} whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted"
						>{row.algo5_rank}</td
					>
					<td
						class="whitespace-nowrap px-3 py-2 text-right text-sm font-semibold tabular-nums text-text-primary"
						>{fmt(row.agg_rating)}</td
					>
					{#if onoverrideclick}
						<td class="whitespace-nowrap px-3 py-2 text-center">
							<button
								type="button"
								class="rounded px-2 py-1 text-xs font-medium {hasOverride
									? 'bg-accent/10 text-accent hover:bg-accent/20'
									: 'text-text-muted hover:bg-surface-alt hover:text-text-primary'} focus:outline-none focus:ring-1 focus:ring-accent"
								onclick={() => handleOverrideClick(row.team_id)}
								title={hasOverride ? 'Edit override' : 'Add override'}
							>
								{hasOverride ? 'Edit' : 'Adjust'}
							</button>
						</td>
					{/if}
				</TierRow>
			{/each}
		</tbody>
	</DataTable>
{/if}
