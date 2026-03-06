<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import Select from '$lib/components/Select.svelte';
	import DataTable from '$lib/components/DataTable.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import { formatTimestamp } from '$lib/utils/format.js';

	let { data } = $props<{
		data: {
			sources: Array<{
				id: string;
				name: string;
				source_type: string;
				format: string;
				enabled: boolean;
			}>;
			initialSourceId: string | null;
		};
	}>();

	interface JobRow {
		id: string;
		source_id: string;
		status: string;
		started_at: string | null;
		completed_at: string | null;
		rows_processed: number;
		rows_inserted: number;
		rows_updated: number;
		rows_skipped: number;
		error_message: string | null;
		created_at: string;
		import_sources: { name: string; source_type: string; format: string } | null;
	}

	let jobs = $state<JobRow[]>([]);
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	// Trigger form
	let selectedSourceId = $state(data.initialSourceId ?? '');
	let selectedStrategy = $state('skip_unresolved');
	let triggering = $state(false);

	const sourceOptions = $derived(
		data.sources.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })),
	);

	const strategyOptions = [
		{ value: 'skip_unresolved', label: 'Skip Unresolved' },
		{ value: 'exact_match_only', label: 'Exact Match Only' },
		{ value: 'fuzzy_threshold', label: 'Fuzzy Match (80%)' },
		{ value: 'create_missing', label: 'Create Missing' },
	];

	async function loadJobs() {
		loading = true;
		errorMessage = '';
		try {
			const params = data.initialSourceId ? `?source_id=${data.initialSourceId}` : '';
			const res = await fetch(`/api/import/jobs${params}`);
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to load jobs.';
				return;
			}
			jobs = result.data.jobs;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load jobs.';
		} finally {
			loading = false;
		}
	}

	async function triggerJob() {
		if (!selectedSourceId) return;
		triggering = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/import/jobs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					source_id: selectedSourceId,
					resolution_strategy: selectedStrategy,
				}),
			});
			const result = await res.json();
			if (!res.ok || !result.success) {
				errorMessage = result.error || 'Failed to trigger job.';
				return;
			}

			const job = result.data.job;
			if (job.status === 'completed') {
				successMessage = `Job completed: ${job.rows_inserted} inserted, ${job.rows_updated} updated, ${job.rows_skipped} skipped.`;
			} else if (job.status === 'failed') {
				errorMessage = `Job failed: ${job.error_message || 'Unknown error'}`;
			} else {
				successMessage = `Job triggered (status: ${job.status}).`;
			}
			await loadJobs();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'Failed to trigger job.';
		} finally {
			triggering = false;
		}
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'completed':
				return 'text-success';
			case 'failed':
				return 'text-red-400';
			case 'running':
				return 'text-accent';
			default:
				return 'text-text-muted';
		}
	}

	// Load jobs on mount
	$effect(() => {
		loadJobs();
	});
</script>

<PageHeader
	title="Import Jobs"
	subtitle="View job history and trigger new import jobs."
/>

<div class="space-y-6">
	{#if errorMessage}
		<Banner variant="error" title="Error">{errorMessage}</Banner>
	{/if}
	{#if successMessage}
		<Banner variant="success">{successMessage}</Banner>
	{/if}

	<!-- Trigger Job -->
	<Card>
		{#snippet header()}
			<h2 class="text-lg font-semibold text-text-primary">Trigger Import Job</h2>
		{/snippet}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Select
				label="Source"
				id="job-source-select"
				options={sourceOptions}
				bind:value={selectedSourceId}
				placeholder="Select a source..."
			/>
			<Select
				label="Resolution Strategy"
				id="job-strategy-select"
				options={strategyOptions}
				bind:value={selectedStrategy}
			/>
			<div class="flex items-end">
				<Button
					variant="primary"
					disabled={!selectedSourceId || triggering}
					loading={triggering}
					onclick={triggerJob}
				>
					Run Import
				</Button>
			</div>
		</div>
	</Card>

	<!-- Job History -->
	<div>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-text-primary">Job History</h2>
			<Button variant="secondary" onclick={loadJobs} disabled={loading}>
				Refresh
			</Button>
		</div>

		{#if loading}
			<Card>
				<div class="flex items-center justify-center py-8">
					<Spinner />
					<span class="ml-3 text-text-muted">Loading jobs...</span>
				</div>
			</Card>
		{:else if jobs.length === 0}
			<Card>
				<p class="py-8 text-center text-text-muted">
					No import jobs found. Select a source above and click "Run Import" to trigger a job.
				</p>
			</Card>
		{:else}
			<!-- Desktop table -->
			<div class="hidden md:block">
				<DataTable caption="Import job history">
					<thead class="bg-surface-alt">
						<tr>
							<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Source</th>
							<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Status</th>
							<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Processed</th>
							<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Inserted</th>
							<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Updated</th>
							<th scope="col" class="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">Skipped</th>
							<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Started</th>
							<th scope="col" class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-muted">Error</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each jobs as job (job.id)}
							<tr class="hover:bg-surface-alt/50">
								<td class="whitespace-nowrap px-3 py-2 text-sm font-medium text-text-primary">
									{job.import_sources?.name ?? 'Unknown'}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-center text-sm font-semibold capitalize {statusColor(job.status)}">
									{job.status}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">
									{job.rows_processed}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">
									{job.rows_inserted}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">
									{job.rows_updated}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-center text-sm tabular-nums text-text-secondary">
									{job.rows_skipped}
								</td>
								<td class="whitespace-nowrap px-3 py-2 text-sm text-text-muted">
									{job.started_at ? formatTimestamp(job.started_at) : '--'}
								</td>
								<td class="max-w-xs truncate px-3 py-2 text-sm text-red-400" title={job.error_message ?? ''}>
									{job.error_message ?? ''}
								</td>
							</tr>
						{/each}
					</tbody>
				</DataTable>
			</div>

			<!-- Mobile card list -->
			<div class="md:hidden space-y-3">
				{#each jobs as job (job.id)}
					<div class="rounded-xl bg-surface shadow-md ring-1 ring-black/[0.04] p-4">
						<div class="flex items-start justify-between mb-2">
							<p class="text-sm font-medium text-text-primary">{job.import_sources?.name ?? 'Unknown'}</p>
							<span class="text-xs font-semibold capitalize {statusColor(job.status)}">{job.status}</span>
						</div>
						<div class="grid grid-cols-3 gap-2 text-center mb-2">
							<div>
								<p class="text-xs text-text-muted">Inserted</p>
								<p class="text-sm font-semibold tabular-nums text-text-primary">{job.rows_inserted}</p>
							</div>
							<div>
								<p class="text-xs text-text-muted">Updated</p>
								<p class="text-sm font-semibold tabular-nums text-text-primary">{job.rows_updated}</p>
							</div>
							<div>
								<p class="text-xs text-text-muted">Skipped</p>
								<p class="text-sm font-semibold tabular-nums text-text-primary">{job.rows_skipped}</p>
							</div>
						</div>
						<div class="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
							<span>{job.rows_processed} processed</span>
							<span>{job.started_at ? formatTimestamp(job.started_at) : '--'}</span>
						</div>
						{#if job.error_message}
							<p class="mt-2 text-xs text-red-400 truncate" title={job.error_message}>{job.error_message}</p>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
