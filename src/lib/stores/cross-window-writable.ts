import { getCurrentWindow } from '@tauri-apps/api/window';
import { Store } from '@tauri-apps/plugin-store';
import equal from 'fast-deep-equal';
import { get, writable, type Writable } from 'svelte/store';
import { APP_STORE_FILE } from '../../app/constants';

export function crossWindowWritable<T>(
	initialValue?: T,
	persist: boolean = false,
	name: string = 'random'
): Writable<T> {
	console.debug('Creating cross window store for', name);
	const wrappedStore = writable<T>(initialValue);
	let currentValue = get(wrappedStore);
	let storePromise: Promise<Store | null>;

	// Initialize store connection asynchronously
	storePromise = (async () => {
		try {
			const store = await Store.load(APP_STORE_FILE, { autoSave: false, createNew: false });

			// Get initial value from store
			const stored = await store.get(name);
			await store.save();
			if (stored !== undefined) {
				currentValue = stored as T;
				wrappedStore.set(currentValue);
			}

			// Subscribe to changes from other windows
			await store.onKeyChange(name, async (newValue: T | undefined) => {
				console.debug(name, 'onKeyChange event', await store.entries());
				if (newValue === undefined) {
					console.warn(`Store value changed to undefined for ${name}, skipping update`);
					return;
				}
				if (equal(newValue, currentValue)) {
					console.debug(`Store value idempotent change for ${name}, skipping update`);
					return;
				}
				if (newValue === null) {
					console.warn(`Store value changed to null for ${name}`);
				}
				console.debug(`${name} value changed from`, currentValue, 'to', newValue);
				currentValue = newValue;
				wrappedStore.set(newValue);
			});

			return store;
		} catch (e) {
			console.error(`Failed to initialize store for ${name}:`, e);
			return null;
		}
	})();

	// If persist is not true, destroy the store value when the window is destroyed
	if (!persist) {
		getCurrentWindow().once('tauri://destroyed', async () => {
			let store;
			if (!storePromise || !(store = await storePromise)) {
				throw new Error('Store is not initialized');
			}
			await store.delete(name);
			await store.save();
		});
	}

	return {
		set: (value: T) => {
			if (!equal(currentValue, value)) {
				currentValue = value;
				wrappedStore.set(value);

				if (!storePromise) {
					throw new Error('Store is not initialized');
				}
				storePromise.then(async (store) => {
					if (store) {
						await store.set(name, value);
						await store.save();
					} else {
						console.error('Store is not initialized');
					}
				});
			}
		},
		subscribe: wrappedStore.subscribe,
		update: (updater: (value: T) => T) => {
			const newValue = updater(currentValue);
			if (!equal(currentValue, newValue)) {
				currentValue = newValue;
				wrappedStore.set(newValue);

				if (!storePromise) {
					throw new Error('Store is not initialized');
				}
				storePromise.then(async (store) => {
					if (store) {
						await store.set(name, newValue);
						await store.save();
					} else {
						console.error('Store is not initialized');
					}
				});
			}
		}
	};
}
