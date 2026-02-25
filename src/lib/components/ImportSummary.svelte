<script lang="ts">
	import type { ImportSummaryData } from '$lib/import/types.js';
	import Button from './Button.svelte';

	let { summary, seasonName, onReset } = $props<{
		summary: ImportSummaryData;
		seasonName?: string;
		onReset: () => void;
	}>();

	let formattedTimestamp = $derived.by(() => {
		try {
			return new Date(summary.timestamp).toLocaleString();
		} catch {
			return summary.timestamp;
		}
	});
</script>

<div class="rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
	<div class="bg-success px-6 py-4">
		<div class="flex items-center gap-3">
			<svg
				class="h-6 w-6 text-white"
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
					clip-rule="evenodd"
				/>
			</svg>
			<h3 class="text-lg font-semibold text-white">Import Completed Successfully</h3>
		</div>
	</div>

	<div class="px-6 py-6">
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			<div class="rounded-lg bg-accent-light p-4">
				<p class="text-sm font-medium text-accent">Rows Inserted</p>
				<p class="mt-1 text-2xl font-bold text-text-primary">{summary.rowsInserted}</p>
			</div>

			<div class="rounded-lg bg-warning-light p-4">
				<p class="text-sm font-medium text-warning">Rows Updated</p>
				<p class="mt-1 text-2xl font-bold text-text-primary">{summary.rowsUpdated}</p>
			</div>

			<div class="rounded-lg bg-surface-alt p-4">
				<p class="text-sm font-medium text-text-muted">Rows Skipped</p>
				<p class="mt-1 text-2xl font-bold text-text-primary">{summary.rowsSkipped}</p>
			</div>

			<div class="rounded-lg bg-success-light p-4">
				<p class="text-sm font-medium text-success">Teams Created</p>
				<p class="mt-1 text-2xl font-bold text-text-primary">{summary.teamsCreated}</p>
			</div>

			<div class="rounded-lg bg-success-light p-4">
				<p class="text-sm font-medium text-success">Tournaments Created</p>
				<p class="mt-1 text-2xl font-bold text-text-primary">{summary.tournamentsCreated}</p>
			</div>

			<div class="rounded-lg bg-accent-light p-4">
				<p class="text-sm font-medium text-accent">Import Mode</p>
				<p class="mt-1 text-lg font-bold capitalize text-text-primary">
					{summary.importMode === 'merge' ? 'Merge/Update' : 'Replace All'}
				</p>
			</div>
		</div>

		<div class="mt-6 border-t border-border pt-4">
			<dl class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
				<div>
					<dt class="font-medium text-text-muted">Season</dt>
					<dd class="text-text-primary">{seasonName || summary.seasonId}</dd>
				</div>
				<div>
					<dt class="font-medium text-text-muted">Age Group</dt>
					<dd class="text-text-primary">{summary.ageGroup}</dd>
				</div>
				<div>
					<dt class="font-medium text-text-muted">Imported At</dt>
					<dd class="text-text-primary">{formattedTimestamp}</dd>
				</div>
			</dl>
		</div>

		<div class="mt-6 border-t border-border pt-6">
			<h4 class="mb-3 text-sm font-semibold text-text-primary">What's next?</h4>
			<div class="flex flex-wrap items-center gap-3">
				<a
					href="/ranking"
					class="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 min-h-[44px]"
				>
					Go to Rankings
				</a>
				<Button variant="secondary" onclick={onReset}>Import Another File</Button>
			</div>
		</div>
	</div>
</div>
