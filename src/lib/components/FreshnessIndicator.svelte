<script lang="ts">
	interface Props {
		timestamp: string;
	}

	let { timestamp }: Props = $props();

	function formatRelativeTime(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diffMs = now - then;
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHours = Math.floor(diffMin / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMin < 1) return 'Just now';
		if (diffMin < 60) return `${diffMin} min ago`;
		if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
	}

	const relativeTime = $derived(formatRelativeTime(timestamp));
</script>

<time datetime={timestamp} class="inline-flex items-center gap-1 text-xs text-text-muted">
	<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
		/>
	</svg>
	{relativeTime}
</time>
