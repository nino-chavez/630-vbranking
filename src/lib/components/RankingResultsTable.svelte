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
		runStatus: _runStatus = 'draft',
		onoverrideclick,
	}: {
		results: NormalizedTeamResult[];
		teams: Record<string, { name: string; region: string }>;
		seedingFactors?: Record<string, SeedingData>;
		rankingRunId?: string;
		overrides?: Record<string, OverrideData>;
		runStatus?: 'draft' | 'finalized';
		onoverrideclick?: (teamId: string, teamName: string, aggRank: number) => void;
	} = $props();

	// --- Sorting State ---
	const hasOverrides = $derived(Object.keys(overrides).length > 0);
	let sortKey = $state<SortKey>('agg_rank');
	let sortDirection = $state<SortDirection>('asc');

	// Switch default sort to final_rank when overrides exist
	$effect(() => {
		if (hasOverrides && sortKey === 'agg_rank') {
			sortKey = 'final_rank';
		}
	});

	// --- Filter State ---
	let searchText = $state('');
	let regionFilter = $state('');

	// --- Derived ---
	const hasSeedingData = $derived(Object.keys(seedingFactors).length > 0);

	const uniqueRegions = $derived(() => {
		const regions = new SvelteSet<string>();
		for (const t of Object.values(teams)) {
			if (t.region) regions.add(t.region);
		}
		return [...regions].sort();
	});

	const regionOptions = $derived(uniqueRegions().map((r) => ({ value: r, label: r })));

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
				placeholder="Search by team name..."
				aria-label="Search teams by name"
				class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
	</div>

	{#if isFiltered}
		<p class="mb-2 text-sm text-text-muted">
			Showing {displayResults.length} of {results.length} teams
		</p>
	{/if}

	<DataTable caption="Ranking results">
		<thead class="bg-[#1C1917] text-white">
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
					class="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Colley Rating</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Colley Rank</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2200 Rating</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2200 Rank</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2400 Rating</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2400 Rank</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2500 Rating</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2500 Rank</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
					>Elo-2700 Rating</th
				>
				<th
					scope="col"
					class="hidden px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70 sm:table-cell"
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
							<RankBadge rank={row.agg_rank} />
						{/if}
					</td>
					<td class="whitespace-nowrap px-3 py-2 text-left text-sm font-medium text-text-primary">
						{#if rankingRunId}
							<a
								href="/ranking/team/{row.team_id}?run_id={rankingRunId}"
								class="text-accent underline-offset-2 hover:underline focus:outline-none focus:ring-1 focus:ring-accent rounded"
								>{teamName(row.team_id)}</a
							>
						{:else}
							{teamName(row.team_id)}
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
						class="hidden whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary sm:table-cell"
						>{fmt(row.algo1_rating)}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted sm:table-cell"
						>{row.algo1_rank}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary sm:table-cell"
						>{fmt(row.algo2_rating)}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted sm:table-cell"
						>{row.algo2_rank}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary sm:table-cell"
						>{fmt(row.algo3_rating)}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted sm:table-cell"
						>{row.algo3_rank}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary sm:table-cell"
						>{fmt(row.algo4_rating)}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted sm:table-cell"
						>{row.algo4_rank}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-right text-sm tabular-nums text-text-secondary sm:table-cell"
						>{fmt(row.algo5_rating)}</td
					>
					<td
						class="hidden whitespace-nowrap px-3 py-2 text-center text-sm text-text-muted sm:table-cell"
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
