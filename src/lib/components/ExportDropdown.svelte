<script lang="ts">
	import Button from './Button.svelte';
	import Spinner from './Spinner.svelte';
	import type { ExportRow, ExportMetadata, ExportOptions } from '$lib/export/types.js';
	import type { OverrideData } from '$lib/ranking/table-utils.js';
	import { generateCsv } from '$lib/export/csv.js';
	import { triggerDownload, exportFilename } from '$lib/export/download.js';

	interface Props {
		rows: ExportRow[];
		metadata: ExportMetadata;
		overrides: Record<string, OverrideData>;
		teams: Record<string, { name: string; region: string }>;
		ageGroup: string;
	}

	let { rows, metadata, overrides, teams, ageGroup }: Props = $props();

	let open = $state(false);
	let includeBreakdowns = $state(false);
	let exporting = $state(false);

	function toggle() {
		open = !open;
	}

	function close() {
		open = false;
	}

	function getOptions(): ExportOptions {
		return { includeAlgorithmBreakdowns: includeBreakdowns };
	}

	async function handleCsv() {
		exporting = true;
		try {
			const csv = generateCsv(rows, metadata, overrides, teams, getOptions());
			const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
			triggerDownload(blob, exportFilename(ageGroup, 'csv'));
		} finally {
			exporting = false;
			close();
		}
	}

	async function handleXlsx() {
		exporting = true;
		try {
			const { generateXlsx } = await import('$lib/export/xlsx.js');
			const buffer = await generateXlsx(rows, metadata, overrides, teams, getOptions());
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			});
			triggerDownload(blob, exportFilename(ageGroup, 'xlsx'));
		} finally {
			exporting = false;
			close();
		}
	}

	async function handlePdf() {
		exporting = true;
		try {
			const { generatePdf } = await import('$lib/export/pdf.js');
			const blob = await generatePdf(rows, metadata, overrides, teams, getOptions());
			triggerDownload(blob, exportFilename(ageGroup, 'pdf'));
		} finally {
			exporting = false;
			close();
		}
	}
</script>

<svelte:window onclick={close} />

<div class="relative inline-block">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={(e) => e.stopPropagation()}>
		<Button variant="secondary" onclick={toggle} disabled={exporting}>
			{#if exporting}
				<Spinner size="sm" />
				Exporting...
			{:else}
				Export
			{/if}
		</Button>

		{#if open}
			<div
				class="absolute right-0 z-10 mt-2 w-56 rounded-md border border-border bg-surface shadow-lg"
				role="menu"
			>
				<div class="border-b border-border px-3 py-2">
					<label class="flex items-center gap-2 text-xs text-text-secondary">
						<input type="checkbox" bind:checked={includeBreakdowns} class="rounded border-border" />
						Include algorithm breakdowns
					</label>
				</div>
				<div class="py-1">
					<button
						class="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-alt"
						role="menuitem"
						onclick={handleCsv}
					>
						Download CSV
					</button>
					<button
						class="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-alt"
						role="menuitem"
						onclick={handleXlsx}
					>
						Download Excel
					</button>
					<button
						class="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-alt"
						role="menuitem"
						onclick={handlePdf}
					>
						Download PDF
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
