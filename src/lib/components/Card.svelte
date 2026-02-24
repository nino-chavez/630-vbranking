<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		header?: Snippet;
		children: Snippet;
		padding?: 'default' | 'none';
	}

	let { header, children, padding = 'default' }: Props = $props();
</script>

<div class="rounded-lg border border-border bg-surface shadow-sm">
	{#if header}
		<div class="border-b border-border px-6 py-4">
			{@render header()}
		</div>
	{/if}
	<div class={padding === 'default' ? 'p-6' : ''}>
		{@render children()}
	</div>
</div>
