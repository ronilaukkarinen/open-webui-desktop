<script lang="ts">
	import { goto } from '$app/navigation';
	import { WEBUI_BASE_URL } from '$lib/stores';

	console.log('On setup page');

	let baseUrl = '';
	const onKeyDown = (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			WEBUI_BASE_URL.set(baseUrl);
			goto('/');
		}
	};
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-8 space-y-8">
	<h1 class="text-4xl font-bold text-center">Welcome to Open WebUI</h1>

	<div class="w-full max-w-md space-y-4">
		<div class="text-center text-gray-600 dark:text-gray-400">
			Please enter your instance base URL to get started
		</div>

		<input
			bind:value={baseUrl}
			placeholder="http://localhost:3000"
			class="w-full rounded-lg py-2 px-4 text-sm dark:text-gray-300 dark:bg-gray-850 outline-none"
			on:keydown={onKeyDown}
		/>
	</div>
</div>
