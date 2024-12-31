<script lang="ts">
	import { getModels } from '$lib/apis';
	import { getTools } from '$lib/apis/tools';
	import {
		appConfig,
		appState,
		config,
		models,
		settings,
		temporaryChatEnabled,
		theme,
		tools,
		user,
		WEBUI_NAME
	} from '$lib/stores';
	import { applyTheme } from '$lib/utils';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { register, unregister, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { setShortcut } from '../../../app/commands/set_shortcut';
	import { APP_STORES_CHANGED } from '../../../app/constants';

	interface StoreChangedPayload {
		store_name:
			| 'models'
			| 'settings'
			| 'config'
			| 'user'
			| 'temporaryChatEnabled'
			| 'tools'
			| 'theme';
		store: any;
	}

	// Sync lib stores with Main Window
	const unlistenStoreChange = listen(
		APP_STORES_CHANGED,
		(event: { payload: StoreChangedPayload }) => {
			console.log('stores changed:', event.payload);
			switch (event.payload.store_name) {
				case 'models':
					models.set(event.payload.store);
					break;
				case 'settings':
					settings.set(event.payload.store);
					break;
				case 'config':
					config.set(event.payload.store);
					break;
				case 'user':
					user.set(event.payload.store);
					break;
				case 'temporaryChatEnabled':
					temporaryChatEnabled.set(event.payload.store);
					break;
				case 'tools':
					tools.set(event.payload.store);
					break;
				case 'theme':
					theme.set(event.payload.store);
					break;
			}
		}
	);

	$: {
		localStorage.setItem('theme', $theme);
		console.log('App theme changed to', $theme);
		applyTheme($theme);
	}

	onMount(() => {
		let unlistenFocusChange: UnlistenFn;
		(async () => {
			// Get models and tools
			models.set(await getModels(localStorage.token));
			tools.set(await getTools(localStorage.token));

			// Move chat bar
			await moveChatBar($appConfig.chatBarPositionPreference, false);

			// Set global shortcut
			await setShortcut($appConfig.shortcut);

			// Add shadows
			const chatBarWindow = getCurrentWindow();
			await chatBarWindow.setShadow(true);

			// Set lose focus: hide
			unlistenFocusChange = await chatBarWindow.onFocusChanged(async ({ payload: focused }) => {
				if (!focused) {
					// Hide the window and remove Escape close window shortcut
					if (!$appState.companionChatOpen) {
						await chatBarWindow.hide();
					}
					await unregister('Escape');
				} else {
					await register('Escape', closeChatBar);
				}
			});
		})();

		return async () => {
			unlistenFocusChange();
			(await unlistenStoreChange)();
		};
	});

	const closeChatBar = async (event: ShortcutEvent) => {
		if (event.state !== 'Pressed') {
			return;
		}

		await getCurrentWindow().hide();
	};
</script>

<svelte:head>
	<title>{$WEBUI_NAME}</title>
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

<style lang="postcss">
	:global(body) {
		@apply w-screen h-screen overflow-hidden;
	}
</style>
