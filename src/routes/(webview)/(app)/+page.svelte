<script lang="ts">
	import { goto } from '$app/navigation';
	import Chat from '$lib/components/chat/Chat.svelte';
	import Help from '$lib/components/layout/Help.svelte';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { CHATBAR_WINDOW_LABEL } from '../../../app/constants';

	onMount(async () => {
		// Redirect chatbar to /desktop-app/chatbar
		if (getCurrentWindow().label === CHATBAR_WINDOW_LABEL && window.location.pathname === '/') {
			await goto('/desktop-app/chatbar');
		}
	});
</script>

<Help />
<Chat />
