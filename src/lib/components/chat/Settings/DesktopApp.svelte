<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { createEventDispatcher, onMount, getContext } from 'svelte';
	import { getLanguages } from '$lib/i18n';
	import { appConfig, models, settings, theme, user } from '$lib/stores';
	import type { ChatBarPosition, ResetChatTime } from '../../../../app/state';
	import type { Writable } from 'svelte/store';
	import type { i18n } from 'i18next';
	import Switch from '$lib/components/common/Switch.svelte';
	import ShortcutEntry from './DesktopApp/ShortcutEntry.svelte';
	import { setShortcut } from '../../../../app/commands/set_shortcut';

	const dispatch = createEventDispatcher();

	const i18n: Writable<i18n> = getContext('i18n');

	// Settings
	let positionOnScreen: ChatBarPosition;
	const positionOnScreenChangeHandler = () => {};

	let resetToNewChat: ResetChatTime;
	const resetToNewChatChangeHandler = () => {};

	let keyboardShortcut: string;
	const keyboardShortcutChangeHandler = () => {
		console.log('Setting keyboard shortcut to', keyboardShortcut);
	};
	const keyboardShortcutClearHandler = () => {
		console.log('Clearing keyboard shortcut...');
	};

	let openNewChatsInCompanion: string;
	const openNewChatsChangeHandler = () => {};

	let launchAtLogin: boolean;
	const launchAtLoginChangeHandler = () => {};

	let openLinksInApp: boolean;
	const openLinksInAppChangeHandler = () => {};

	const saveConfig = async () => {
		console.log('Saving settings. Before:', Object.entries($appConfig));
		// sets shortcut and saves to config
		if (await setShortcut(keyboardShortcut)) {
			$appConfig.shortcut = keyboardShortcut;
		}

		$appConfig.chatBarPositionPreference = positionOnScreen;
		$appConfig.resetChatTimePreference = resetToNewChat;

		$appConfig.openChatsInCompanion = openNewChatsInCompanion === 'true';
		$appConfig.autoLaunch = launchAtLogin;
		// $appConfig. = openLinksInApp;

		console.log('After:', $appConfig);
		dispatch('save');
	};

	onMount(async () => {
		console.log($appConfig);

		positionOnScreen = $appConfig.chatBarPositionPreference;
		resetToNewChat = $appConfig.resetChatTimePreference;
		keyboardShortcut = $appConfig.shortcut;
		openNewChatsInCompanion = $appConfig.openChatsInCompanion ? 'true' : 'false';
		launchAtLogin = $appConfig.autoLaunch;
		// openLinksInApp = $appConfig.;
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
					<Switch bind:state={openLinksInApp} on:change={openLinksInAppChangeHandler} />
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
