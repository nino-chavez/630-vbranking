<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import Select from '$lib/components/Select.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { AgeGroup } from '$lib/schemas/enums.js';
	import { formatTimestamp } from '$lib/utils/format.js';

	let { data } = $props<{
		data: {
			seasons: Array<{ id: string; name: string; is_active: boolean }>;
		};
	}>();

	interface SourceRow {
		id: string;
		name: string;
		source_type: string;
		config: Record<string, unknown>;
		season_id: string;
		age_group: string;
		format: string;
		enabled: boolean;
		last_run_at: string | null;
		created_at: string;
	}

	let sources = $state<SourceRow[]>([]);
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Create form state
	let showCreateForm = $state(false);
	let newName = $state('');
	let newSourceType = $state<'xlsx_file' | 'xlsx_url'>('xlsx_url');
	let newSeasonId = $state('');
	let newAgeGroup = $state('');
	let newFormat = $state<'finishes' | 'colley'>('finishes');
	let newUrl = $state('');
	let creating = $state(false);

	const seasonOptions = $derived(
		data.seasons.map((s: { id: string; name: string; is_active: boolean }) => ({
			value: s.id,
			label: `${s.name}${s.is_active ? ' (Active)' : ''}`,
		})),
	);
	const ageGroupOptions = AgeGroup.options.map((ag) => ({ value: ag, label: ag }));
	const sourceTypeOptions = [
		{ value: 'xlsx_url', label: 'URL (XLSX)' },
		{ value: 'xlsx_file', label: 'File Upload' },
	];
	const formatOptions = [
		{ value: 'finishes', label: 'Finishes' },
		{ value: 'colley', label: 'Colley' },
	];

	async function loadSources() {
		loading = true;
		errorMessage = '';
		try {
			const res = await fetch('/api/import/sources');
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to load sources.';
				return;
			}
			sources = result.data.sources;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load sources.';
		} finally {
			loading = false;
		}
	}

	async function createSource() {
		if (!newName || !newSeasonId || !newAgeGroup) return;
		creating = true;
		errorMessage = '';
		successMessage = '';

		const config: Record<string, string> = {};
		if (newSourceType === 'xlsx_url' && newUrl) {
			config.url = newUrl;
		}

		try {
			const res = await fetch('/api/import/sources', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newName,
					source_type: newSourceType,
					season_id: newSeasonId,
					age_group: newAgeGroup,
					format: newFormat,
					config,
				}),
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to create source.';
				return;
			}

			successMessage = `Source "${newName}" created successfully.`;
			showCreateForm = false;
			newName = '';
			newUrl = '';
			await loadSources();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to create source.';
		} finally {
			creating = false;
		}
	}

	async function deleteSource(id: string, name: string) {
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch(`/api/import/sources?id=${id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to delete source.';
				return;
			}
			successMessage = `Source "${name}" deleted.`;
			await loadSources();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to delete source.';
		}
	}

	async function toggleEnabled(source: SourceRow) {
		errorMessage = '';
		try {
			const res = await fetch('/api/import/sources', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: source.id, enabled: !source.enabled }),
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to update source.';
				return;
			}
			await loadSources();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to update source.';
		}
	}

	function getSeasonName(seasonId: string): string {
		return data.seasons.find((s: { id: string; name: string }) => s.id === seasonId)?.name ?? seasonId;
	}

	// Load sources on mount
	$effect(() => {
		loadSources();
	});
</script>

<PageHeader
	title="Import Sources"
	subtitle="Manage automated data import sources for tournament results and ranking data."
/>

<div class="space-y-6">
	{#if errorMessage}
		<Banner variant="error" title="Error">{errorMessage}</Banner>
	{/if}
	{#if successMessage}
		<Banner variant="success">{successMessage}</Banner>
	{/if}

	<div class="flex items-center justify-between">
		<h2 class="text-lg font-semibold text-text-primary">Configured Sources</h2>
		<Button variant="primary" onclick={() => (showCreateForm = !showCreateForm)}>
			{showCreateForm ? 'Cancel' : '+ New Source'}
		</Button>
	</div>

	{#if showCreateForm}
		<Card>
			{#snippet header()}
				<h3 class="text-lg font-semibold text-text-primary">Create New Source</h3>
			{/snippet}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label for="source-name" class="block text-sm font-medium text-text-secondary">
						Name
					</label>
					<input
						id="source-name"
						type="text"
						bind:value={newName}
						class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder="e.g., AAU National Results"
					/>
				</div>
				<Select
					label="Source Type"
					id="source-type-select"
					options={sourceTypeOptions}
					bind:value={newSourceType}
				/>
				<Select
					label="Season"
					id="source-season-select"
					options={seasonOptions}
					bind:value={newSeasonId}
					placeholder="Select a season..."
				/>
				<Select
					label="Age Group"
					id="source-age-group-select"
					options={ageGroupOptions}
					bind:value={newAgeGroup}
					placeholder="Select age group..."
				/>
				<Select
					label="Format"
					id="source-format-select"
					options={formatOptions}
					bind:value={newFormat}
				/>
				{#if newSourceType === 'xlsx_url'}
					<div class="sm:col-span-2">
						<label for="source-url" class="block text-sm font-medium text-text-secondary">
							Source URL
						</label>
						<input
							id="source-url"
							type="url"
							bind:value={newUrl}
							class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
							placeholder="https://example.com/results.xlsx"
						/>
					</div>
				{/if}
			</div>
			<div class="mt-4">
				<Button
					variant="primary"
					disabled={!newName || !newSeasonId || !newAgeGroup || creating}
					loading={creating}
					onclick={createSource}
				>
					Create Source
				</Button>
			</div>
		</Card>
	{/if}

	{#if loading}
		<Card>
			<div class="flex items-center justify-center py-8">
				<Spinner />
				<span class="ml-3 text-text-muted">Loading sources...</span>
			</div>
		</Card>
	{:else if sources.length === 0}
		<Card>
			<p class="py-8 text-center text-text-muted">
				No import sources configured. Click "+ New Source" to create one.
			</p>
		</Card>
	{:else}
		<!-- Desktop table -->
		<div class="hidden md:block">
			<DataTable caption="Configured import sources">
				<thead class="bg-surface-alt">
					<tr>
						<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Name</th>
						<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Type</th>
						<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Season</th>
						<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Age Group</th>
						<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Format</th>
						<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Enabled</th>
						<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Last Run</th>
						<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each sources as source (source.id)}
						<tr class="hover:bg-surface-alt/50">
							<td class="whitespace-nowrap px-3 py-2 text-sm font-medium text-text-primary">{source.name}</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary">
								{source.source_type === 'xlsx_url' ? 'URL' : 'File'}
							</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-secondary">{getSeasonName(source.season_id)}</td>
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm text-text-secondary">{source.age_group}</td>
							<td class="whitespace-nowrap px-3 py-2 text-center text-sm text-text-secondary capitalize">{source.format}</td>
							<td class="whitespace-nowrap px-3 py-2 text-center">
								<button
									type="button"
									class="inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors
										{source.enabled
											? 'bg-success/20 text-success hover:bg-success/30'
											: 'bg-border text-text-muted hover:bg-border/70'}"
									onclick={() => toggleEnabled(source)}
								>
									{source.enabled ? 'Active' : 'Disabled'}
								</button>
							</td>
							<td class="whitespace-nowrap px-3 py-2 text-sm text-text-muted">
								{source.last_run_at ? formatTimestamp(source.last_run_at) : 'Never'}
							</td>
							<td class="whitespace-nowrap px-3 py-2 text-center">
								<div class="flex items-center justify-center gap-2">
									<a
										href="/import/jobs?source_id={source.id}"
										class="text-xs font-medium text-accent hover:underline"
									>
										Jobs
									</a>
									<button
										type="button"
										class="text-xs font-medium text-red-400 hover:underline"
										onclick={() => deleteSource(source.id, source.name)}
									>
										Delete
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</DataTable>
		</div>

		<!-- Mobile card list -->
		<div class="md:hidden space-y-3">
			{#each sources as source (source.id)}
				<div class="rounded-xl bg-surface shadow-md ring-1 ring-black/[0.04] p-4">
					<div class="flex items-start justify-between mb-2">
						<div>
							<p class="text-sm font-medium text-text-primary">{source.name}</p>
							<p class="text-xs text-text-muted">{getSeasonName(source.season_id)} &middot; {source.age_group}</p>
						</div>
						<button
							type="button"
							class="inline-flex items-center rounded px-2 py-1 text-xs font-medium transition-colors
								{source.enabled
									? 'bg-success/20 text-success hover:bg-success/30'
									: 'bg-border text-text-muted hover:bg-border/70'}"
							onclick={() => toggleEnabled(source)}
						>
							{source.enabled ? 'Active' : 'Disabled'}
						</button>
					</div>
					<div class="flex items-center gap-3 text-xs text-text-secondary mb-3">
						<span>{source.source_type === 'xlsx_url' ? 'URL' : 'File'}</span>
						<span class="capitalize">{source.format}</span>
						<span>Last: {source.last_run_at ? formatTimestamp(source.last_run_at) : 'Never'}</span>
					</div>
					<div class="flex items-center gap-3 pt-2 border-t border-border">
						<a
							href="/import/jobs?source_id={source.id}"
							class="text-xs font-medium text-accent hover:underline"
						>
							View Jobs
						</a>
						<button
							type="button"
							class="text-xs font-medium text-red-400 hover:underline"
							onclick={() => deleteSource(source.id, source.name)}
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
