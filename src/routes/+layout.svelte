<script lang="ts">
	import 'tippy.js/dist/tippy.css';
	import '../app.css';
	import '../tailwind.css';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getBackendConfig } from '$lib/apis';
	import { getSessionUser } from '$lib/apis/auths';
	import Draggable from '$lib/components/desktop-app/Draggable.svelte';
	import i18n, { getLanguages, initI18n } from '$lib/i18n';
	import {
		activeUserCount,
		appConfig,
		appState,
		config,
		mobile,
		socket,
		theme,
		USAGE_POOL,
		user,
		WEBUI_BASE_URL,
		WEBUI_NAME
	} from '$lib/stores';
	import { bestMatchingLanguage } from '$lib/utils';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { unregisterAll } from '@tauri-apps/plugin-global-shortcut';
	import { load } from '@tauri-apps/plugin-store';
	import { io } from 'socket.io-client';
	import { onMount, setContext, tick } from 'svelte';
	import { spring } from 'svelte/motion';
	import reopenMainWindow from '../app/actions/reopen_main_window';
	import { APP_STORE_FILE, CHATBAR_WINDOW_LABEL } from '../app/constants';

	let loadingProgress = spring(0, {
		stiffness: 0.05
	});

	// Initialize i18n
	setContext('i18n', i18n);

	let loaded = false;
	const BREAKPOINT = 768;

	const setupSocket = () => {
		const _socket = io(`${$WEBUI_BASE_URL}` || undefined, {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			randomizationFactor: 0.5,
			path: '/ws/socket.io',
			auth: { token: localStorage.token }
		});

		socket.set(_socket);

		_socket.on('connect_error', (err) => {
			console.log('connect_error', err);
		});

		_socket.on('connect', () => {
			console.log('connected', _socket.id);
		});

		_socket.on('reconnect_attempt', (attempt) => {
			console.log('reconnect_attempt', attempt);
		});

		_socket.on('reconnect_failed', () => {
			console.log('reconnect_failed');
		});

		_socket.on('disconnect', (reason, details) => {
			console.log(`Socket ${_socket.id} disconnected due to ${reason}`);
			if (details) {
				console.log('Additional details:', details);
			}
		});

		_socket.on('user-count', (data) => {
			console.log('user-count', data);
			activeUserCount.set(data.count);
		});

		_socket.on('usage', (data) => {
			console.log('usage', data);
			USAGE_POOL.set(data['models']);
		});
	};

	onMount(() => {
		const onResize = () => {
			if (window.innerWidth < BREAKPOINT) {
				mobile.set(true);
			} else {
				mobile.set(false);
			}
		};

		let unlistenReopen: UnlistenFn;
		(async () => {
			// Load the store
			await load(APP_STORE_FILE, { autoSave: false, createNew: false });

			// Redirect chatbar to /desktop-app/chatbar
			if (getCurrentWindow().label === CHATBAR_WINDOW_LABEL && window.location.pathname === '/') {
				await goto('/desktop-app/chatbar');
			}

			/////////////////////////////////
			// INITIALIZE APP STATE
			/////////////////////////////////

			// Reopen event listener
			unlistenReopen = await listen('reopen', async () => {
				await reopenMainWindow();
			});

			console.log('Initial app state:', $appState, $appConfig);

			theme.set(localStorage.theme);

			mobile.set(window.innerWidth < BREAKPOINT);

			window.addEventListener('resize', onResize);

			let backendConfig = null;
			try {
				backendConfig = await getBackendConfig();
				console.log('Backend config:', backendConfig);
			} catch (error) {
				console.error('Error loading backend config:', error);
			}
			// Initialize i18n even if we didn't get a backend config,
			// so `/error` can show something that's not `undefined`.

			initI18n();
			if (!localStorage.locale) {
				const languages = await getLanguages();
				const browserLanguages = navigator.languages
					? navigator.languages
					: // @ts-expect-error Compatibility with older Internet Explorer browsers
						[navigator.language || navigator.userLanguage];
				const lang = backendConfig.default_locale
					? backendConfig.default_locale
					: bestMatchingLanguage(languages, browserLanguages, 'en-US');
				$i18n.changeLanguage(lang);
			}

			if (backendConfig) {
				// Save Backend Status to Store
				$config = backendConfig;
				$WEBUI_NAME = backendConfig.name;

				if ($config) {
					setupSocket();

					if (localStorage.token) {
						console.log('Token:', localStorage.token);

						// Get Session User Info
						const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
							console.error(error);
							return null;
						});

						if (sessionUser) {
							// Save Session User to Store
							$user = sessionUser;
							$config = await getBackendConfig();
						} else {
							// Redirect Invalid Session User to /auth Page
							localStorage.removeItem('token');
							await goto('/auth');
						}
					} else {
						// Don't redirect if we're already on the auth page
						// Needed because we pass in tokens from OAuth logins via URL fragments
						if ($page.url.pathname !== '/auth') {
							// await goto('/auth');
							window.location.href = '/auth';
						}
					}
				}
			} else {
				// Redirect to /error when Backend Not Detected
				await goto(`/error`);
			}

			await tick();

			if (
				document.documentElement.classList.contains('her') &&
				document.getElementById('progress-bar')
			) {
				loadingProgress.subscribe((value) => {
					const progressBar = document.getElementById('progress-bar');

					if (progressBar) {
						progressBar.style.width = `${value}%`;
					}
				});

				await loadingProgress.set(100);

				document.getElementById('splash-screen')?.remove();

				const audio = new Audio(`/audio/greeting.mp3`);
				const playAudio = () => {
					audio.play();
					document.removeEventListener('click', playAudio);
				};

				document.addEventListener('click', playAudio);

				loaded = true;
			} else {
				document.getElementById('splash-screen')?.remove();
				loaded = true;
			}
		})();

		return async () => {
			window.removeEventListener('resize', onResize);

			// Unregister all global shortcuts
			await unregisterAll();

			// Unlisten to Reopen event
			unlistenReopen();
		};
	});
</script>

<Draggable />
{#if loaded}
	<slot />
{/if}
