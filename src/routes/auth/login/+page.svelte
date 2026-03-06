<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');

	async function handleLogin() {
		loading = true;
		errorMessage = '';

		try {
			const response = await fetch('/auth/callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, action: 'login' }),
			});

			const result = await response.json();

			if (!response.ok) {
				errorMessage = result.error || 'Login failed. Please check your credentials.';
				return;
			}

			window.location.href = '/';
		} catch {
			errorMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex flex-col bg-bg">
	<!-- Mini nav -->
	<nav class="nav-630">
		<div class="nav-630-inner">
			<a href="/" class="nav-630-logo">
				<span>630</span>
				<span class="nav-630-app-badge">VB Ranking</span>
			</a>
		</div>
	</nav>

	<main class="flex-1 flex items-center justify-center px-4 py-12">
		<div class="w-full max-w-sm">
			{#if errorMessage}
				<div class="mb-6">
					<Banner variant="error">{errorMessage}</Banner>
				</div>
			{/if}

			<div class="rounded-2xl bg-surface shadow-lg ring-1 ring-black/[0.04] p-8">
				<div class="text-center mb-6">
					<h1 class="text-2xl font-bold text-text-primary">Sign In</h1>
					<p class="text-sm text-text-muted mt-1">VB Ranking Engine</p>
				</div>

				<form
					class="space-y-4"
					onsubmit={(e) => {
						e.preventDefault();
						handleLogin();
					}}
				>
					<div>
						<label for="email" class="block text-sm font-medium text-text-secondary">Email</label>
						<input
							id="email"
							type="email"
							required
							bind:value={email}
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-text-secondary">Password</label>
						<input
							id="password"
							type="password"
							required
							bind:value={password}
							class="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
							placeholder="Your password"
						/>
					</div>

					<div class="flex justify-end">
						<a
							href="/auth/forgot-password"
							class="text-sm font-medium text-accent hover:underline"
						>Forgot your password?</a>
					</div>

					<Button variant="primary" type="submit" disabled={loading} {loading}>
						{loading ? 'Signing in...' : 'Sign In'}
					</Button>
				</form>
			</div>
		</div>
	</main>

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
