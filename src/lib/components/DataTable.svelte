<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		caption?: string;
		stickyHeader?: boolean;
	}

	let { children, caption, stickyHeader = true }: Props = $props();
</script>

<div class="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
	<table class="min-w-full divide-y divide-border">
		{#if caption}
			<caption class="sr-only">{caption}</caption>
		{/if}
		{@render children()}
	</table>
</div>

{#if stickyHeader}
	<style>
		:global(thead) {
			position: sticky;
			top: 0;
			z-index: 10;
		}
	</style>
{/if}
