<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleSignup() {
		loading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/auth/callback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, action: 'signup' }),
			});

			const result = await response.json();

			if (!response.ok) {
				errorMessage = result.error || 'Signup failed. Please try again.';
				return;
			}

			if (result.confirmEmail) {
				successMessage = 'Check your email for a confirmation link to complete your registration.';
			} else {
				window.location.href = '/';
			}
		} catch {
			errorMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<PageHeader title="Sign Up" subtitle="Create an account to access the Volleyball Ranking Engine." />

<div class="mx-auto max-w-md">
	{#if errorMessage}
		<div class="mb-6">
			<Banner variant="error">{errorMessage}</Banner>
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-6">
			<Banner variant="success">{successMessage}</Banner>
		</div>
	{:else}
		<Card>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleSignup();
				}}
			>
				<div>
					<label for="email" class="block text-sm font-medium text-text-secondary">Email</label>
					<input
						id="email"
						type="email"
						required
						bind:value={email}
						class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder="you@example.com"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-text-secondary"
						>Password</label
					>
					<input
						id="password"
						type="password"
						required
						minlength={6}
						bind:value={password}
						class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder="At least 6 characters"
					/>
				</div>

				<Button variant="primary" type="submit" disabled={loading} {loading}>
					{loading ? 'Creating account...' : 'Create Account'}
				</Button>

				<p class="text-center text-sm text-text-muted">
					Already have an account?
					<a href="/auth/login" class="font-medium text-accent hover:text-accent-hover">Log in</a>
				</p>
			</form>
		</Card>
	{/if}
</div>
