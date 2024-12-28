<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { createEventDispatcher, onMount, getContext } from 'svelte';
	import { appConfig } from '$lib/stores';
	import type { ChatBarPosition, ResetChatTime } from '../../../../app/state';
	import type { Writable } from 'svelte/store';
	import type { i18n } from 'i18next';
	import Switch from '$lib/components/common/Switch.svelte';
	import ShortcutEntry from './DesktopApp/ShortcutEntry.svelte';
	import { setShortcut } from '../../../../app/commands/set_shortcut';
	import { delay } from '$lib/utils';
	import { isRegistered, unregister } from '@tauri-apps/plugin-global-shortcut';
	import * as autoStart from '@tauri-apps/plugin-autostart';

	const BANNED_SHORTCUTS = [
		'cmd+c',
		'cmd+v',
		'cmd+a',
		'cmd+x',
		'cmd+z',
		'cmd+shift+z',
		'cmd+s',
		'cmd+shift+s',
		'cmd+backspace',
		'cmd+shift+backspace',
		'cmd+q',
		'cmd+w',
		'cmd+shift+w',
		'cmd+f',
		'cmd+m'
	];

	const dispatch = createEventDispatcher();

	const i18n: Writable<i18n> = getContext('i18n');

	// Settings
	let positionOnScreen: ChatBarPosition;
	const positionOnScreenChangeHandler = () => {};

	let resetToNewChat: ResetChatTime;
	const resetToNewChatChangeHandler = () => {};

	let keyboardShortcut: string;
	const keyboardShortcutChangeHandler = async () => {
		try {
			if (keyboardShortcut !== $appConfig.shortcut && (await isRegistered(keyboardShortcut))) {
				toast.error($i18n.t('Shortcut already in use. Please try another.'));
				keyboardShortcut = $appConfig.shortcut;
			} else if (BANNED_SHORTCUTS.includes(keyboardShortcut.toLowerCase())) {
				toast.error($i18n.t('Invalid shortcut. Please try another.'));
				keyboardShortcut = $appConfig.shortcut;
			}
		} catch {
			toast.error($i18n.t('Invalid shortcut. Please try another.'));
			keyboardShortcut = $appConfig.shortcut;
		}
	};
	const keyboardShortcutClearHandler = () => {
		keyboardShortcut = '';
	};

	let openNewChatsInCompanion: string;
	const openNewChatsChangeHandler = () => {};

	let launchAtLogin: boolean;
	const launchAtLoginChangeHandler = () => {};

	let openLinksInApp: boolean;
	const openLinksInAppChangeHandler = () => {};

	const saveConfig = async () => {
		console.debug('Saving settings. Before:', Object.entries($appConfig));
		// sets shortcut and saves to config

		console.debug('Right before set:', keyboardShortcut);
		if (keyboardShortcut !== $appConfig.shortcut) {
			if (keyboardShortcut === '') {
				await unregister($appConfig.shortcut);
				$appConfig.shortcut = '';
			} else if (await setShortcut(keyboardShortcut)) {
				$appConfig.shortcut = keyboardShortcut;
			} else {
				keyboardShortcut = $appConfig.shortcut;
				delay(50).then(() => toast.warning($i18n.t('Failed to set shortcut. Please try again.')));
			}
		}

		try {
			if (launchAtLogin) {
				await autoStart.enable();
			} else {
				await autoStart.disable();
			}
		} catch (e) {
			console.error('Failed to set launch at login to', launchAtLogin, e);
		}

		$appConfig.chatBarPositionPreference = positionOnScreen;
		$appConfig.resetChatTimePreference = resetToNewChat;

		$appConfig.openChatsInCompanion = openNewChatsInCompanion === 'true';
		$appConfig.openLinksInApp = openLinksInApp;

		console.debug('After:', $appConfig);
		dispatch('save');
	};

	onMount(async () => {
		positionOnScreen = $appConfig.chatBarPositionPreference;
		resetToNewChat = $appConfig.resetChatTimePreference;
		keyboardShortcut = $appConfig.shortcut;
		openNewChatsInCompanion = $appConfig.openChatsInCompanion ? 'true' : 'false';
		launchAtLogin = await autoStart.isEnabled();
		openLinksInApp = $appConfig.openLinksInApp;
	});
</script>

<div class="flex flex-col flex-grow flex-shrink justify-between text-sm">
	<div class="overflow-y-scroll max-h-[28rem] lg:max-h-full">
		<div class="">
			<div class=" mb-1 text-sm font-medium">{$i18n.t('Desktop App Settings')}</div>

			<div class="flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Position on Screen')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={positionOnScreen}
						on:change={positionOnScreenChangeHandler}
					>
						<option value="BOTTOM_CENTER">{$i18n.t('Bottom Center')}</option>
						<option value="BOTTOM_LEFT">{$i18n.t('Bottom Left')}</option>
						<option value="BOTTOM_RIGHT">{$i18n.t('Bottom Right')}</option>
						<option value="REMEMBER_LAST">{$i18n.t('Remember Last')}</option>
					</select>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Reset to New Chat')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={resetToNewChat}
						on:change={resetToNewChatChangeHandler}
					>
						<option value="IMMEDIATELY">{$i18n.t('Immediately')}</option>
						<option value="10_MIN">{$i18n.t('After 10 minutes')}</option>
						<option value="15_MIN">{$i18n.t('After 15 minutes')}</option>
						<option value="30_MIN">{$i18n.t('After 30 minutes')}</option>
						<option value="NEVER">{$i18n.t('Never')}</option>
					</select>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Keyboard Shortcut')}</div>
				<div class="flex items-center relative">
					<ShortcutEntry
						bind:value={keyboardShortcut}
						on:change={keyboardShortcutChangeHandler}
						on:clear={keyboardShortcutClearHandler}
					/>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Open New Chats')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={openNewChatsInCompanion}
						on:change={openNewChatsChangeHandler}
						disabled={true}
					>
						<option value="true">{$i18n.t('In Companion Chat')}</option>
						<option value="false">{$i18n.t('In Main Window')}</option>
					</select>
				</div>
			</div>
		</div>

		<div class=" flex w-full justify-between">
			<div class=" self-center text-xs font-medium">
				{$i18n.t('Open Open WebUI Links in Desktop App')}
			</div>
			<div class="flex items-center relative">
				<div class="mt-1">
					<Switch
						bind:state={openLinksInApp}
						on:change={openLinksInAppChangeHandler}
						disabled={true}
					/>
				</div>
			</div>
		</div>

		<div class=" flex w-full justify-between">
			<div class=" self-center text-xs font-medium">{$i18n.t('Launch at Login')}</div>
			<div class="flex items-center relative">
				<div class="mt-1">
					<Switch bind:state={launchAtLogin} on:change={launchAtLoginChangeHandler} />
				</div>
			</div>
		</div>
	</div>
	<div class="flex justify-end pt-3 text-sm font-medium">
		<button
			class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
			on:click={saveConfig}
		>
			{$i18n.t('Save')}
		</button>
	</div>
</div>
