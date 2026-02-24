<script lang="ts">
	import type { User } from '@supabase/supabase-js';

	interface Props {
		currentPath: string;
		user?: User | null;
	}

	let { currentPath, user = null }: Props = $props();

	const links = [
		{ href: '/import', label: 'Import' },
		{ href: '/ranking', label: 'Rankings' },
		{ href: '/ranking/weights', label: 'Weights' },
	];

	function isActive(href: string): boolean {
		return currentPath === href || currentPath.startsWith(href + '/');
	}

	async function handleLogout() {
		const response = await fetch('/auth/logout', { method: 'POST' });
		if (response.ok) {
			window.location.href = '/auth/login';
		}
	}
</script>

<nav aria-label="Main navigation" class="border-b border-border bg-surface">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a
			href="/"
			class="text-lg font-bold text-text-primary hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded"
		>
			Volleyball Rankings
		</a>
		<div class="flex items-center gap-6">
			{#each links as link (link.href)}
				<a
					href={link.href}
					class="inline-flex items-center border-b-2 px-1 py-1 text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent rounded
            {isActive(link.href)
						? 'border-accent text-accent'
						: 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-strong'}"
					aria-current={isActive(link.href) ? 'page' : undefined}
				>
					{link.label}
				</a>
			{/each}

			<div class="ml-4 flex items-center gap-3 border-l border-border pl-4">
				{#if user}
					<span class="text-sm text-text-muted">{user.email}</span>
					<button
						type="button"
						class="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
						onclick={handleLogout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/auth/login"
						class="text-sm font-medium text-accent hover:text-accent-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded"
					>
						Log in
					</a>
				{/if}
			</div>
		</div>
	</div>
</nav>
