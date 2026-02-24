<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import RankBadge from '$lib/components/RankBadge.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import { toOrdinal, formatDate, formatTimestamp } from '$lib/utils/format.js';

	let { data } = $props<{
		data: {
			team: { id: string; name: string; code: string; region: string; age_group: string };
			ranking: {
				algo1_rating: number;
				algo1_rank: number;
				algo2_rating: number;
				algo2_rank: number;
				algo3_rating: number;
				algo3_rank: number;
				algo4_rating: number;
				algo4_rank: number;
				algo5_rating: number;
				algo5_rank: number;
				agg_rating: number;
				agg_rank: number;
			} | null;
			override: {
				original_rank: number;
				final_rank: number;
				justification: string;
				committee_member: string;
				created_at: string;
				updated_at: string;
			} | null;
			history: Array<{
				tournament_name: string;
				tournament_date: string;
				division: string;
				finish_position: number;
				field_size: number;
			}>;
			h2h: {
				total_wins: number;
				total_losses: number;
				has_match_data: boolean;
				opponents: Array<{ id: string; name: string; wins: number; losses: number }>;
			};
			runId: string;
		};
	}>();

	const algorithms = $derived(
		data.ranking
			? [
					{
						name: 'Colley Matrix',
						rating: data.ranking.algo1_rating,
						rank: data.ranking.algo1_rank,
					},
					{ name: 'Elo-2200', rating: data.ranking.algo2_rating, rank: data.ranking.algo2_rank },
					{ name: 'Elo-2400', rating: data.ranking.algo3_rating, rank: data.ranking.algo3_rank },
					{ name: 'Elo-2500', rating: data.ranking.algo4_rating, rank: data.ranking.algo4_rank },
					{ name: 'Elo-2700', rating: data.ranking.algo5_rating, rank: data.ranking.algo5_rank },
				]
			: [],
	);

	function fmt(n: number): string {
		return n.toFixed(2);
	}

	function winPct(wins: number, losses: number): string {
		const total = wins + losses;
		if (total === 0) return '0.0%';
		return ((wins / total) * 100).toFixed(1) + '%';
	}
</script>

<div class="mb-4">
	<a
		href="/ranking"
		class="inline-flex items-center gap-1 text-sm text-accent hover:underline focus:outline-none focus:ring-1 focus:ring-accent rounded"
		>&larr; Back to Rankings</a
	>
</div>

<PageHeader
	title={data.team.name}
	subtitle="{data.team.code} | {data.team.region} | {data.team.age_group}"
/>

<div class="space-y-6">
	<!-- Ranking Summary -->
	{#if data.ranking}
		<Card>
			{#snippet header()}
				<h2 class="text-lg font-semibold text-text-primary">Ranking Summary</h2>
			{/snippet}
			<div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
				<div class="text-center">
					<div class="text-sm text-text-muted">Aggregate Rank</div>
					<div class="mt-1"><RankBadge rank={data.ranking.agg_rank} /></div>
				</div>
				<div class="text-center">
					<div class="text-sm text-text-muted">Aggregate Rating</div>
					<div class="mt-1 text-2xl font-bold tabular-nums text-text-primary">
						{fmt(data.ranking.agg_rating)}
					</div>
				</div>
				<div class="text-center">
					<div class="text-sm text-text-muted">Overall Record</div>
					<div class="mt-1 text-lg font-semibold tabular-nums text-text-primary">
						{data.h2h.total_wins}W - {data.h2h.total_losses}L
					</div>
				</div>
				<div class="text-center">
					<div class="text-sm text-text-muted">Tournaments Played</div>
					<div class="mt-1 text-lg font-semibold tabular-nums text-text-primary">
						{data.history.length}
					</div>
				</div>
			</div>
		</Card>
	{:else}
		<Banner variant="warning">No ranking data found for this team in the selected run.</Banner>
	{/if}

	<!-- Committee Adjustment -->
	{#if data.override}
		<Card>
			{#snippet header()}
				<h2 class="text-lg font-semibold text-text-primary">Committee Adjustment</h2>
			{/snippet}
			<div class="space-y-4">
				<div class="flex items-center gap-6">
					<div class="text-center">
						<div class="text-xs font-medium uppercase tracking-wider text-text-muted">
							Algo Rank
						</div>
						<div class="mt-1 text-xl font-bold tabular-nums text-text-secondary">
							{toOrdinal(data.override.original_rank)}
						</div>
					</div>
					<div class="text-text-muted">&rarr;</div>
					<div class="text-center">
						<div class="text-xs font-medium uppercase tracking-wider text-text-muted">
							Final Seed
						</div>
						<div class="mt-1 text-xl font-bold tabular-nums text-accent">
							{toOrdinal(data.override.final_rank)}
						</div>
					</div>
				</div>
				<div>
					<div class="text-sm font-medium text-text-secondary">Justification</div>
					<p class="mt-1 text-sm text-text-primary">{data.override.justification}</p>
				</div>
				<div class="flex items-center gap-4 text-xs text-text-muted">
					<span
						>By: <span class="font-medium text-text-secondary"
							>{data.override.committee_member}</span
						></span
					>
					<span>Updated: {formatTimestamp(data.override.updated_at)}</span>
				</div>
			</div>
		</Card>
	{/if}

	<!-- Algorithm Breakdown -->
	{#if algorithms.length > 0}
		<Card>
			{#snippet header()}
				<h2 class="text-lg font-semibold text-text-primary">Algorithm Breakdown</h2>
			{/snippet}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-5">
				{#each algorithms as algo (algo.name)}
					<div class="rounded-lg border border-border bg-surface-alt p-4 text-center">
						<div class="text-xs font-medium uppercase tracking-wider text-text-muted">
							{algo.name}
						</div>
						<div class="mt-2 text-xl font-bold tabular-nums text-text-primary">
							{fmt(algo.rating)}
						</div>
						<div class="mt-1 text-sm text-text-secondary">
							Rank: <span class="font-semibold">{toOrdinal(algo.rank)}</span>
						</div>
					</div>
				{/each}
			</div>
		</Card>
	{/if}

	<!-- Tournament History -->
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Tournament History</h2>
		{/snippet}
		{#if data.history.length === 0}
			<p class="py-6 text-center text-text-muted">No tournament results found for this season.</p>
		{:else}
			<DataTable caption="Tournament history">
				<thead class="bg-surface-alt">
					<tr>
						<th
							scope="col"
							class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
							>Tournament</th
						>
						<th
							scope="col"
							class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
							>Date</th
						>
						<th
							scope="col"
							class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
							>Division</th
						>
						<th
							scope="col"
							class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
							>Finish</th
						>
						<th
							scope="col"
							class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
							>Field Size</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.history as entry (entry.tournament_name + entry.tournament_date)}
						<tr class="hover:bg-surface-alt/50">
							<td class="whitespace-nowrap px-3 py-2 text-sm font-medium text-text-primary"
								>{entry.tournament_name}</td
							>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary"
								>{formatDate(entry.tournament_date)}</td
							>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary"
								>{entry.division}</td
							>
							<td
								class="whitespace-nowrap px-3 py-2 text-center text-sm font-semibold text-text-primary"
								>{toOrdinal(entry.finish_position)}</td
							>
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm text-text-secondary"
								>{entry.field_size}</td
							>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		{/if}
	</Card>

	<!-- Head-to-Head Records -->
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Head-to-Head Records</h2>
		{/snippet}
		{#if !data.h2h.has_match_data}
			<Banner variant="info">
				Head-to-head records require individual match results to be imported. Only tournament
				finishes are currently available.
			</Banner>
		{:else}
			<div class="mb-4 text-center">
				<span class="text-2xl font-bold tabular-nums text-text-primary">
					{data.h2h.total_wins}W - {data.h2h.total_losses}L
				</span>
				<span class="ml-2 text-sm text-text-muted">
					({winPct(data.h2h.total_wins, data.h2h.total_losses)})
				</span>
			</div>
			{#if data.h2h.opponents.length > 0}
				<DataTable caption="Head-to-head records by opponent">
					<thead class="bg-surface-alt">
						<tr>
							<th
								scope="col"
								class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted"
								>Opponent</th
							>
							<th
								scope="col"
								class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
								>Wins</th
							>
							<th
								scope="col"
								class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
								>Losses</th
							>
							<th
								scope="col"
								class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted"
								>Win %</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each data.h2h.opponents as opp (opp.id)}
							<tr class="hover:bg-surface-alt/50">
								<td class="whitespace-nowrap px-3 py-2 text-sm font-medium text-text-primary"
									>{opp.name}</td
								>
								<td
									class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary"
									>{opp.wins}</td
								>
								<td
									class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary"
									>{opp.losses}</td
								>
								<td
									class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary"
									>{winPct(opp.wins, opp.losses)}</td
								>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			{/if}
		{/if}
	</Card>

	<!-- Bottom Navigation -->
	<div class="text-center">
		<a
			href="/ranking"
			class="inline-flex items-center gap-1 text-sm text-accent hover:underline focus:outline-none focus:ring-1 focus:ring-accent rounded"
			>&larr; Back to Rankings</a
		>
	</div>
</div>
