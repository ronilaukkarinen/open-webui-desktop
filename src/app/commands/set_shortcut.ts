import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { getStore } from '@tauri-apps/plugin-store';
import onShortcut from '../handlers/on_shortcut';
import type { AppConfig } from '../state';
import { APP_STORE_FILE } from '../constants';

export async function setShortcut(keybind: string): Promise<boolean> {
	// get store
	const store = await getStore(APP_STORE_FILE);
	if (!store) {
		throw new Error('Failed to get store');
	}

	// get config
	let config = await store.get<AppConfig>('config');
	if (!config) {
		throw new Error('Failed to get App Config');
	}

	console.log(Object.entries(config));

	// get old keybind, set new keybind
	const old_keybind = config.shortcut;
	try {
		// unregister old shortcut
		if (old_keybind) {
			await unregister(old_keybind);
		}

		// attempt to register new shortcut
		await register(keybind, onShortcut);
		console.log('Set chatbar shortcut to', keybind);
		return true;
	} catch {
		console.warn(`Shortcut ${keybind} is not valid, using ${old_keybind}`);
		// re-register old shortcut
		await register(old_keybind, onShortcut);
		return false;
	}
}
