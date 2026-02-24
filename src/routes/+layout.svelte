<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import NavHeader from '$lib/components/NavHeader.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import { page } from '$app/state';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<NavHeader currentPath={page.url.pathname} user={data.user} />
<PageShell>
	{@render children()}
</PageShell>
