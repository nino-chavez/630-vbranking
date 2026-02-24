<script lang="ts">
	import Button from './Button.svelte';
	import Card from './Card.svelte';
	import Banner from './Banner.svelte';

	interface OverrideFormData {
		final_rank: number;
		justification: string;
		committee_member: string;
	}

	interface Props {
		open: boolean;
		teamName: string;
		teamId: string;
		originalRank: number;
		runStatus: 'draft' | 'finalized';
		existingOverride?: {
			final_rank: number;
			justification: string;
			committee_member: string;
		} | null;
		onsave: (data: OverrideFormData) => void;
		onremove: () => void;
		onclose: () => void;
	}

	let {
		open,
		teamName,
		teamId: _teamId,
		originalRank,
		runStatus,
		existingOverride = null,
		onsave,
		onremove,
		onclose,
	}: Props = $props();

	let finalRank = $state(0);
	let justification = $state('');
	let committeeMember = $state('');

	const isReadOnly = $derived(runStatus === 'finalized');
	const hasExisting = $derived(existingOverride != null);

	// Validation
	const justificationValid = $derived(justification.trim().length >= 10);
	const committeeMemberValid = $derived(committeeMember.trim().length >= 2);
	const formValid = $derived(justificationValid && committeeMemberValid && finalRank > 0);

	// Reset form when panel opens or override data changes
	$effect(() => {
		if (open) {
			finalRank = existingOverride?.final_rank ?? originalRank;
			justification = existingOverride?.justification ?? '';
			committeeMember = existingOverride?.committee_member ?? '';
		}
	});

	function handleSave() {
		if (!formValid || isReadOnly) return;
		onsave({
			final_rank: finalRank,
			justification: justification.trim(),
			committee_member: committeeMember.trim(),
		});
	}

	function handleRemove() {
		if (isReadOnly) return;
		onremove();
	}

	function handleBackdropClick() {
		onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
		}
	}
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 bg-black/30"
		role="presentation"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
	></div>

	<!-- Panel -->
	<div
		class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto bg-surface shadow-xl"
		role="dialog"
		aria-label="Override panel for {teamName}"
	>
		<div class="flex items-center justify-between border-b border-border px-6 py-4">
			<h2 class="text-lg font-semibold text-text-primary">Committee Override</h2>
			<button
				type="button"
				class="rounded-md p-1.5 text-text-muted hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
				onclick={onclose}
				aria-label="Close panel"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</div>

		<div class="flex-1 space-y-4 px-6 py-4">
			{#if isReadOnly}
				<Banner variant="info">This run has been finalized. Overrides are read-only.</Banner>
			{/if}

			<Card>
				{#snippet header()}
					<h3 class="text-sm font-semibold text-text-primary">Team</h3>
				{/snippet}
				<div class="space-y-1">
					<div class="text-base font-medium text-text-primary">{teamName}</div>
					<div class="text-sm text-text-muted">
						Algorithmic Rank: <span class="font-semibold">{originalRank}</span>
					</div>
				</div>
			</Card>

			<div class="space-y-4">
				<!-- Final Rank -->
				<div>
					<label
						for="override-final-rank"
						class="mb-1 block text-sm font-medium text-text-secondary">Final Seed</label
					>
					<input
						id="override-final-rank"
						type="number"
						min="1"
						class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
						bind:value={finalRank}
						disabled={isReadOnly}
					/>
				</div>

				<!-- Justification -->
				<div>
					<label
						for="override-justification"
						class="mb-1 block text-sm font-medium text-text-secondary">Justification</label
					>
					<textarea
						id="override-justification"
						rows="4"
						placeholder="Explain the reason for this override (min 10 characters)..."
						class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
						bind:value={justification}
						disabled={isReadOnly}
					></textarea>
					{#if justification.length > 0 && !justificationValid}
						<p class="mt-1 text-xs text-error">Justification must be at least 10 characters</p>
					{/if}
				</div>

				<!-- Committee Member -->
				<div>
					<label
						for="override-committee-member"
						class="mb-1 block text-sm font-medium text-text-secondary">Committee Member</label
					>
					<input
						id="override-committee-member"
						type="text"
						placeholder="Name (min 2 characters)..."
						class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
						bind:value={committeeMember}
						disabled={isReadOnly}
					/>
					{#if committeeMember.length > 0 && !committeeMemberValid}
						<p class="mt-1 text-xs text-error">Name must be at least 2 characters</p>
					{/if}
				</div>
			</div>
		</div>

		<!-- Actions -->
		{#if !isReadOnly}
			<div class="flex items-center gap-3 border-t border-border px-6 py-4">
				<Button variant="primary" disabled={!formValid} onclick={handleSave}>
					{hasExisting ? 'Update Override' : 'Save Override'}
				</Button>
				{#if hasExisting}
					<Button variant="danger" onclick={handleRemove}>Remove</Button>
				{/if}
				<Button variant="ghost" onclick={onclose}>Cancel</Button>
			</div>
		{:else}
			<div class="border-t border-border px-6 py-4">
				<Button variant="ghost" onclick={onclose}>Close</Button>
			</div>
		{/if}
	</div>
{/if}
