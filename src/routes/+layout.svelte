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

<div class="min-h-screen flex flex-col">
	<NavHeader currentPath={page.url.pathname} user={data.user} />
	<PageShell>
		{@render children()}
	</PageShell>

	<footer class="footer-630">
		<div class="footer-630-inner">
			<div class="footer-630-divider"></div>
			<div class="footer-630-bottom">
				<p>&copy; 2026 630 Volleyball</p>
				<p>VB Ranking</p>
			</div>
		</div>
	</footer>
</div>
