<script lang="ts">
	interface Props {
		rank: number;
	}

	let { rank }: Props = $props();

	const isTopFive = $derived(rank <= 5);
</script>

<span
	class="inline-flex min-w-[2rem] items-center justify-center tabular-nums
    {isTopFive ? 'text-lg font-bold text-text-primary' : 'text-sm font-medium text-text-secondary'}"
>
	{rank}
</span>
