<script lang="ts">
	import type { User } from '@supabase/supabase-js';

	interface Props {
		currentPath: string;
		user?: User | null;
	}

	let { currentPath, user = null }: Props = $props();
	let mobileMenuOpen = $state(false);

	const links = [
		{ href: '/import', label: 'Import' },
		{ href: '/ranking', label: 'Rankings' },
		{ href: '/ranking/weights', label: 'Weights' },
		{ href: '/settings', label: 'Settings' },
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

	function toggleMenu() {
		mobileMenuOpen = !mobileMenuOpen;
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

		<!-- Desktop nav -->
		<div class="hidden md:flex items-center gap-6">
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
						class="min-h-[44px] px-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors rounded focus:outline-none focus:ring-2 focus:ring-accent"
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

		<!-- Mobile hamburger button -->
		<button
			type="button"
			class="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-accent"
			onclick={toggleMenu}
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-menu"
		>
			<span class="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
			{#if mobileMenuOpen}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{:else}
				<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			{/if}
		</button>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div id="mobile-menu" class="md:hidden border-t border-border bg-surface">
			<div class="space-y-1 px-4 py-3">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class="block rounded-md px-3 py-3 text-base font-medium transition-colors
							{isActive(link.href)
							? 'bg-accent-light text-accent'
							: 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'}"
						aria-current={isActive(link.href) ? 'page' : undefined}
						onclick={() => (mobileMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
			</div>
			<div class="border-t border-border px-4 py-3">
				{#if user}
					<p class="text-sm text-text-muted truncate">{user.email}</p>
					<button
						type="button"
						class="mt-2 block w-full rounded-md px-3 py-3 text-left text-base font-medium text-text-secondary hover:bg-surface-alt hover:text-text-primary transition-colors"
						onclick={handleLogout}
					>
						Log out
					</button>
				{:else}
					<a
						href="/auth/login"
						class="block rounded-md px-3 py-3 text-base font-medium text-accent hover:bg-accent-light transition-colors"
						onclick={() => (mobileMenuOpen = false)}
					>
						Log in
					</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>
