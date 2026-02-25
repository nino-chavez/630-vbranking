<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';

	interface SeasonRow {
		id: string;
		name: string;
		start_date: string;
		end_date: string;
		is_active: boolean;
		ranking_scope: 'single_season' | 'cross_season';
		created_at: string;
		updated_at: string;
	}

	let { data } = $props<{ data: { seasons: SeasonRow[] } }>();

	const rankingScopeOptions: Array<{ value: string; label: string }> = [
		{ value: 'single_season', label: 'Single Season' },
		{ value: 'cross_season', label: 'Cross Season' },
	];

	// --- State ---
	const initialSeasons = data.seasons;
	let seasons = $state<SeasonRow[]>(initialSeasons);
	let feedbackMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// Create form state
	let creating = $state(false);
	let newName = $state('');
	let newStartDate = $state('');
	let newEndDate = $state('');
	let newIsActive = $state(true);
	let newRankingScope = $state('single_season');

	// Inline edit state
	let editingId = $state<string | null>(null);
	let editName = $state('');
	let editStartDate = $state('');
	let editEndDate = $state('');
	let editIsActive = $state(true);
	let editRankingScope = $state('single_season');
	let savingEdit = $state(false);

	// Delete state
	let deletingId = $state<string | null>(null);

	function clearFeedback() {
		feedbackMessage = null;
	}

	function resetCreateForm() {
		newName = '';
		newStartDate = '';
		newEndDate = '';
		newIsActive = true;
		newRankingScope = 'single_season';
	}

	async function handleCreate() {
		if (!newName || !newStartDate || !newEndDate) {
			feedbackMessage = { type: 'error', text: 'Name, start date, and end date are required.' };
			return;
		}

		creating = true;
		clearFeedback();

		try {
			const response = await fetch('/api/admin/seasons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: newName,
					start_date: newStartDate,
					end_date: newEndDate,
					is_active: newIsActive,
					ranking_scope: newRankingScope,
				}),
			});

			const result = await response.json();

			if (result.success) {
				seasons = [result.data.season, ...seasons];
				resetCreateForm();
				feedbackMessage = { type: 'success', text: `Season "${result.data.season.name}" created.` };
			} else {
				feedbackMessage = { type: 'error', text: result.error || 'Failed to create season.' };
			}
		} catch {
			feedbackMessage = { type: 'error', text: 'Failed to create season.' };
		} finally {
			creating = false;
		}
	}

	function startEdit(season: SeasonRow) {
		editingId = season.id;
		editName = season.name;
		editStartDate = season.start_date;
		editEndDate = season.end_date;
		editIsActive = season.is_active;
		editRankingScope = season.ranking_scope;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function handleSaveEdit() {
		if (!editingId || !editName || !editStartDate || !editEndDate) {
			feedbackMessage = { type: 'error', text: 'All fields are required.' };
			return;
		}

		savingEdit = true;
		clearFeedback();

		try {
			const response = await fetch('/api/admin/seasons', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: editingId,
					name: editName,
					start_date: editStartDate,
					end_date: editEndDate,
					is_active: editIsActive,
					ranking_scope: editRankingScope,
				}),
			});

			const result = await response.json();

			if (result.success) {
				seasons = seasons.map((s) => (s.id === editingId ? result.data.season : s));
				editingId = null;
				feedbackMessage = { type: 'success', text: `Season "${result.data.season.name}" updated.` };
			} else {
				feedbackMessage = { type: 'error', text: result.error || 'Failed to update season.' };
			}
		} catch {
			feedbackMessage = { type: 'error', text: 'Failed to update season.' };
		} finally {
			savingEdit = false;
		}
	}

	async function handleDelete(season: SeasonRow) {
		if (!confirm(`Delete season "${season.name}"? This cannot be undone.`)) return;

		deletingId = season.id;
		clearFeedback();

		try {
			const response = await fetch(`/api/admin/seasons?id=${season.id}`, {
				method: 'DELETE',
			});

			const result = await response.json();

			if (result.success) {
				seasons = seasons.filter((s) => s.id !== season.id);
				feedbackMessage = { type: 'success', text: `Season "${season.name}" deleted.` };
			} else {
				feedbackMessage = { type: 'error', text: result.error || 'Failed to delete season.' };
			}
		} catch {
			feedbackMessage = { type: 'error', text: 'Failed to delete season.' };
		} finally {
			deletingId = null;
		}
	}
</script>

<PageHeader title="Settings" subtitle="Manage seasons and system configuration." />

<div class="space-y-6">
	{#if feedbackMessage}
		<Banner variant={feedbackMessage.type === 'success' ? 'success' : 'error'}>
			{feedbackMessage.text}
		</Banner>
	{/if}

	<!-- Create Season -->
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Create Season</h2>
		{/snippet}
		<form onsubmit={(e) => { e.preventDefault(); handleCreate(); }}>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<div>
					<label for="new-name" class="block text-sm font-medium text-text-primary mb-1">Name</label>
					<input
						id="new-name"
						type="text"
						bind:value={newName}
						placeholder="e.g. 2025-2026"
						class="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
					/>
				</div>
				<div>
					<label for="new-start-date" class="block text-sm font-medium text-text-primary mb-1">Start Date</label>
					<input
						id="new-start-date"
						type="date"
						bind:value={newStartDate}
						class="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
					/>
				</div>
				<div>
					<label for="new-end-date" class="block text-sm font-medium text-text-primary mb-1">End Date</label>
					<input
						id="new-end-date"
						type="date"
						bind:value={newEndDate}
						class="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
					/>
				</div>
				<div>
					<label for="new-is-active" class="block text-sm font-medium text-text-primary mb-1">Active</label>
					<select
						id="new-is-active"
						bind:value={newIsActive}
						class="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
					>
						<option value={true}>Yes</option>
						<option value={false}>No</option>
					</select>
				</div>
				<div>
					<label for="new-ranking-scope" class="block text-sm font-medium text-text-primary mb-1">Ranking Scope</label>
					<select
						id="new-ranking-scope"
						bind:value={newRankingScope}
						class="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-1 focus:ring-accent"
					>
						{#each rankingScopeOptions as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<Button variant="primary" type="submit" loading={creating} disabled={creating}>
					{creating ? 'Creating...' : 'Create Season'}
				</Button>
			</div>
		</form>
	</Card>

	<!-- Seasons Table -->
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Seasons</h2>
		{/snippet}
		{#if seasons.length === 0}
			<div class="py-8 text-center text-text-muted">No seasons yet. Create one above.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-text-muted">
							<th class="px-3 py-2">Name</th>
							<th class="px-3 py-2">Start</th>
							<th class="px-3 py-2">End</th>
							<th class="px-3 py-2">Active</th>
							<th class="px-3 py-2">Scope</th>
							<th class="px-3 py-2">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each seasons as season (season.id)}
							{#if editingId === season.id}
								<tr class="bg-surface-alt/50">
									<td class="px-3 py-2">
										<input
											type="text"
											bind:value={editName}
											class="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
										/>
									</td>
									<td class="px-3 py-2">
										<input
											type="date"
											bind:value={editStartDate}
											class="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
										/>
									</td>
									<td class="px-3 py-2">
										<input
											type="date"
											bind:value={editEndDate}
											class="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
										/>
									</td>
									<td class="px-3 py-2">
										<select
											bind:value={editIsActive}
											class="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
										>
											<option value={true}>Yes</option>
											<option value={false}>No</option>
										</select>
									</td>
									<td class="px-3 py-2">
										<select
											bind:value={editRankingScope}
											class="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
										>
											{#each rankingScopeOptions as opt (opt.value)}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
									</td>
									<td class="px-3 py-2">
										<div class="flex gap-2">
											<Button variant="primary" size="sm" loading={savingEdit} disabled={savingEdit} onclick={handleSaveEdit}>
												Save
											</Button>
											<Button variant="ghost" size="sm" disabled={savingEdit} onclick={cancelEdit}>
												Cancel
											</Button>
										</div>
									</td>
								</tr>
							{:else}
								<tr class="hover:bg-surface-alt/50">
									<td class="whitespace-nowrap px-3 py-2 font-medium text-text-primary">{season.name}</td>
									<td class="whitespace-nowrap px-3 py-2 text-text-secondary">{season.start_date}</td>
									<td class="whitespace-nowrap px-3 py-2 text-text-secondary">{season.end_date}</td>
									<td class="px-3 py-2">
										{#if season.is_active}
											<span class="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">Active</span>
										{:else}
											<span class="inline-flex items-center rounded-full bg-surface-alt px-2 py-0.5 text-xs font-medium text-text-muted">Inactive</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-3 py-2 text-text-secondary">
										{rankingScopeOptions.find((o) => o.value === season.ranking_scope)?.label ?? season.ranking_scope}
									</td>
									<td class="px-3 py-2">
										<div class="flex gap-2">
											<Button variant="ghost" size="sm" onclick={() => startEdit(season)}>
												Edit
											</Button>
											<Button variant="danger" size="sm" loading={deletingId === season.id} disabled={deletingId === season.id} onclick={() => handleDelete(season)}>
												Delete
											</Button>
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>
