import { getStore } from '@tauri-apps/plugin-store';
import { Window } from '@tauri-apps/api/window';
import {
	APP_STORE_FILE,
	CHATBAR_WINDOW_LABEL,
	CHATBAR_WINDOW_SIZE,
	COMPANION_CHAT_EXPIRED,
	DEFAULT_STATE
} from '../constants';
import moveChatBar from '../actions/move_chatbar';
import { resetChatTimePreferenceToSeconds, type AppConfig, type AppState } from '../state';
import type { ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';

export default async function onShortcut(event: ShortcutEvent) {
	console.log('onShortcut');
	if (event.state !== 'Pressed') {
		return;
	}

	// get store
	const store = await getStore(APP_STORE_FILE);
	if (!store) {
		throw new Error('Failed to get store');
	}

	// get state
	let state = await store.get<AppState>('state');
	if (!state) {
		throw new Error('Failed to get App State');
	}

	// get config
	let config = await store.get<AppConfig>('config');
	if (!config) {
		throw new Error('Failed to get App Config');
	}

	// get window
	const window = await Window.getByLabel(CHATBAR_WINDOW_LABEL);
	if (!window) {
		throw new Error('Failed to get chatbar window');
	}

	// if visible, then hide
	if (await window.isVisible()) {
		if (state.companionChatOpen && !(await window.isFocused())) {
			await window.setFocus();
			document.getElementById('chat-input')?.focus();
		} else {
			await window.hide();
		}
		return;
	}

	let lastChatTime = state.lastChatTime;
	let timeSinceLastChat = Date.now() - lastChatTime;
	let companionChatOpen = state.companionChatOpen;
	let resetChatTime = resetChatTimePreferenceToSeconds(config.resetChatTimePreference);
	let chatBarPosition = config.chatBarPositionPreference;
	console.log('timeSinceLastChat', timeSinceLastChat, 'resetChatTime', resetChatTime);
	if (companionChatOpen && timeSinceLastChat > resetChatTime) {
		await window.emitTo('chatbar', COMPANION_CHAT_EXPIRED);
		await window.setResizable(false);
		await window.setSize(CHATBAR_WINDOW_SIZE);
		await moveChatBar(chatBarPosition, companionChatOpen);
		// 1/60s delay to allow movement, resizing, state change before it appears
		await new Promise((resolve) => setTimeout(resolve, 17));
	} else if (!companionChatOpen) {
		await moveChatBar(chatBarPosition, companionChatOpen);
	}

	await window.show();
	await window.setFocus();
	document.getElementById('chat-input')?.focus();

	await store.set('state', state);
}
