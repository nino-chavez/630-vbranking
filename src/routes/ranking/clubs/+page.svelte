<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Select from '$lib/components/Select.svelte';
	import Button from '$lib/components/Button.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import { AgeGroup } from '$lib/schemas/enums.js';
	import { toOrdinal } from '$lib/utils/format.js';

	let { data } = $props<{
		data: {
			seasons: Array<{ id: string; name: string }>;
		};
	}>();

	interface ClubResult {
		id: string;
		name: string;
		region: string | null;
		team_count: number;
		avg_rating: number;
		best_team: string;
		best_rank: number;
	}

	let selectedSeasonId = $state('');
	let selectedAgeGroup = $state('');
	let clubs = $state<ClubResult[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let errorMessage = $state('');
	let infoMessage = $state('');

	const contextReady = $derived(selectedSeasonId !== '' && selectedAgeGroup !== '');

	const seasonOptions = $derived(
		data.seasons.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })),
	);
	const ageGroupOptions = AgeGroup.options.map((ag) => ({ value: ag, label: ag }));

	async function loadClubs() {
		if (!contextReady || loading) return;
		loading = true;
		errorMessage = '';
		infoMessage = '';

		try {
			const res = await fetch(
				`/api/ranking/clubs?season_id=${selectedSeasonId}&age_group=${selectedAgeGroup}`,
			);
			const result = await res.json();

			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to load club rankings.';
				return;
			}

			clubs = result.data.clubs;
			if (result.data.message) {
				infoMessage = result.data.message;
			}
			loaded = true;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}
</script>

<PageHeader
	title="Club Rankings"
	subtitle="Clubs ranked by average aggregate rating of member teams."
/>

<div class="space-y-6">
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Select Context</h2>
		{/snippet}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Select
				label="Season"
				id="club-season-select"
				options={seasonOptions}
				bind:value={selectedSeasonId}
				placeholder="Select a season..."
			/>
			<Select
				label="Age Group"
				id="club-age-group-select"
				options={ageGroupOptions}
				bind:value={selectedAgeGroup}
				placeholder="Select age group..."
			/>
		</div>
		<div class="mt-4">
			<Button variant="primary" disabled={!contextReady || loading} {loading} onclick={loadClubs}>
				Load Club Rankings
			</Button>
		</div>
	</Card>

	{#if errorMessage}
		<Banner variant="error" title="Error">{errorMessage}</Banner>
	{/if}

	{#if infoMessage}
		<Banner variant="info">{infoMessage}</Banner>
	{/if}

	{#if loaded && clubs.length === 0 && !infoMessage}
		<Card>
			<p class="py-8 text-center text-text-muted">
				No clubs found. Teams must be assigned to clubs to see club rankings.
			</p>
		</Card>
	{/if}

	{#if clubs.length > 0}
		<!-- Desktop table -->
		<div class="hidden md:block">
			<DataTable caption="Club rankings by average team rating">
				<thead class="bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] text-white">
					<tr>
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">#</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Club</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Region</th>
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">Teams</th>
						<th scope="col" class="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/70">Avg Rating</th>
						<th scope="col" class="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/70">Best Team</th>
						<th scope="col" class="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-white/70">Best Rank</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each clubs as club, i (club.id)}
						<tr class="hover:bg-surface-alt/50">
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm font-semibold tabular-nums text-text-primary">{i + 1}</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm font-medium text-text-primary">{club.name}</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary">{club.region ?? '--'}</td>
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">{club.team_count}</td>
							<td class="whitespace-nowrap px-3 py-2 text-right text-sm font-semibold tabular-nums text-accent">{club.avg_rating.toFixed(2)}</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary">{club.best_team}</td>
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">{toOrdinal(club.best_rank)}</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		</div>

		<!-- Mobile card list -->
		<div class="md:hidden space-y-3">
			{#each clubs as club, i (club.id)}
				<div class="rounded-xl bg-surface shadow-md ring-1 ring-black/[0.04] p-4">
					<div class="flex items-start justify-between mb-2">
						<div class="flex items-center gap-2">
							<span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold tabular-nums">{i + 1}</span>
							<div>
								<p class="text-sm font-medium text-text-primary">{club.name}</p>
								<p class="text-xs text-text-muted">{club.region ?? 'No region'}</p>
							</div>
						</div>
						<span class="text-sm font-bold tabular-nums text-accent">{club.avg_rating.toFixed(2)}</span>
					</div>
					<div class="flex items-center gap-4 text-xs text-text-secondary mt-2 pt-2 border-t border-border">
						<span>{club.team_count} team{club.team_count !== 1 ? 's' : ''}</span>
						<span>Best: {club.best_team} ({toOrdinal(club.best_rank)})</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
