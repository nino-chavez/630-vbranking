<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Banner from '$lib/components/Banner.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';

	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleUpdatePassword() {
		loading = true;
		errorMessage = '';

		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			loading = false;
			return;
		}

		if (password.length < 8) {
			errorMessage = 'Password must be at least 8 characters.';
			loading = false;
			return;
		}

		try {
			const { error } = await supabase.auth.updateUser({ password });

			if (error) {
				errorMessage = 'Failed to update password. The link may have expired.';
				return;
			}

			successMessage = 'Password updated successfully. Redirecting to login...';
			setTimeout(() => goto('/auth/login'), 2000);
		} catch {
			errorMessage = 'An unexpected error occurred. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<PageHeader title="Reset Password" subtitle="Enter your new password below." />

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
					handleUpdatePassword();
				}}
			>
				<div>
					<label for="password" class="block text-sm font-medium text-text-secondary"
						>New Password</label
					>
					<input
						id="password"
						type="password"
						required
						minlength={8}
						bind:value={password}
						class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder="At least 8 characters"
					/>
				</div>

				<div>
					<label for="confirm-password" class="block text-sm font-medium text-text-secondary"
						>Confirm Password</label
					>
					<input
						id="confirm-password"
						type="password"
						required
						minlength={8}
						bind:value={confirmPassword}
						class="mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
						placeholder="Repeat your new password"
					/>
				</div>

				<Button variant="primary" type="submit" disabled={loading} {loading}>
					{loading ? 'Updating...' : 'Update Password'}
				</Button>
			</form>
		</Card>
	{/if}
</div>
