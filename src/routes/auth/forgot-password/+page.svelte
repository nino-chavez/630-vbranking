<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let email = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleReset() {
		loading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/auth/forgot-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			const result = await response.json();

			if (!response.ok) {
				errorMessage = result.error || 'Something went wrong. Please try again.';
				return;
			}

			successMessage = 'Check your email for a password reset link.';
		} catch {
			errorMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<PageHeader title="Forgot Password" subtitle="Enter your email to receive a password reset link." />

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
		<p class="text-center text-sm text-text-muted">
			<a href="/auth/login" class="font-medium text-accent hover:text-accent-hover"
				>Back to login</a
			>
		</p>
	{:else}
		<Card>
			<form
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					handleReset();
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

				<Button variant="primary" type="submit" disabled={loading} {loading}>
					{loading ? 'Sending...' : 'Send Reset Link'}
				</Button>

				<p class="text-center text-sm text-text-muted">
					<a href="/auth/login" class="font-medium text-accent hover:text-accent-hover"
						>Back to login</a
					>
				</p>
			</form>
		</Card>
	{/if}
</div>
