<script lang="ts">
	import { goto } from '$app/navigation';
	import { APP_STORE_FILE } from '$lib/app/constants';
	import { WEBUI_BASE_URL } from '$lib/stores';
	import { getStore } from '@tauri-apps/plugin-store';
	import { onMount } from 'svelte';

	console.debug('On setup page');

	let baseUrl = '';
	const onKeyDown = async (e: KeyboardEvent) => {
		if (e.key === 'Enter') {
			revealSplashScreen();
			$WEBUI_BASE_URL = baseUrl;
		}
	};

	$: if ($WEBUI_BASE_URL) {
		goto('/', { replaceState: true });
	}

	let splashScreen: HTMLElement | null;
	// Function to reveal the splash screen later
	const revealSplashScreen = () => {
		if (splashScreen) {
			splashScreen.style.display = ''; // Reset display to original
			splashScreen.dataset.visible = 'true'; // Update visibility state
		}
	};

	onMount(async () => {
		console.log('SETUP PAGE MOUNTED');
		const store = await getStore(APP_STORE_FILE);
		for (const key of (await store?.keys()) || []) {
			if (key !== 'app_config' && key !== 'webui_base_url') {
				await store?.delete(key);
			}
		}
		await store?.save();
		console.log(await store?.entries());
		// Hide splash screen, since we haven't loaded yet we'll need to put it back later
		splashScreen = document.getElementById('splash-screen');
		if (splashScreen) {
			splashScreen.style.display = 'none'; // Hide the element
			splashScreen.dataset.visible = 'false'; // Store visibility state
		}
	});
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
