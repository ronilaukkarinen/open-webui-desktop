<script lang="ts">
	import { goto } from '$app/navigation';
	import { theme, WEBUI_BASE_URL, WEBUI_NAME } from '$lib/stores';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { OPEN_IN_MAIN_WINDOW } from '../../app/constants';

	onMount(() => {
		let unlistenOpenInMainWindow: UnlistenFn;
		(async () => {
			unlistenOpenInMainWindow = await listen(OPEN_IN_MAIN_WINDOW, async (event) => {
				if (!event.payload || !event.payload.chatId) {
					console.warn('open in main window called without chatId');
					return;
				}
				await goto(`/c/${event.payload.chatId}`);
				console.log('Chat', event.payload.chatId, 'opened in main window');
				await getCurrentWindow().setFocus();
			});
		})();

		return () => {
			unlistenOpenInMainWindow();
		};
	});
</script>

<svelte:head>
	<title>{$WEBUI_NAME}</title>
	<link crossorigin="anonymous" rel="icon" href="{$WEBUI_BASE_URL}/static/favicon.png" />

	<!-- rosepine themes have been disabled as it's not up to date with our latest version. -->
	<!-- feel free to make a PR to fix if anyone wants to see it return -->
	<!-- <link rel="stylesheet" type="text/css" href="/themes/rosepine.css" />
	<link rel="stylesheet" type="text/css" href="/themes/rosepine-dawn.css" /> -->
</svelte:head>
<slot />
<Toaster
	theme={$theme.includes('dark')
		? 'dark'
		: $theme === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: 'light'}
	richColors
	position="top-center"
/>
