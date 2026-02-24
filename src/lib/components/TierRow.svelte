<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		rank: number;
		children: Snippet;
	}

	let { rank, children }: Props = $props();

	const tierClass = $derived(
		rank <= 5 ? 'bg-tier-1' : rank <= 15 ? 'bg-tier-2' : rank <= 30 ? 'bg-tier-3' : 'bg-tier-4',
	);
</script>

<tr class={tierClass}>
	{@render children()}
</tr>
