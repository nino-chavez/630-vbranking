<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		rank: number;
		children: Snippet;
	}

	let { rank, children }: Props = $props();

	const tierClass = $derived(
		rank <= 5
			? 'bg-tier-1 border-l-4 border-amber-500'
			: rank <= 15
				? 'bg-tier-2 border-l-4 border-blue-400'
				: rank <= 30
					? 'bg-tier-3 border-l-4 border-emerald-400'
					: 'bg-tier-4',
	);
</script>

<tr class="{tierClass} hover:bg-surface-alt transition-colors">
	{@render children()}
</tr>
