import { browser } from '$app/environment';
import { page } from '$app/stores';
import { get } from 'svelte/store';

/**
 * Check if the current context should use Tauri drag regions
 * Only apply drag regions in specific desktop app contexts like chatbar
 */
export function shouldUseDragRegion(): boolean {
	if (!browser) return false;
	
	try {
		// Check if we're in a Tauri environment
		const isTauri = '__TAURI__' in window;
		if (!isTauri) return false;
		
		// Only apply drag regions for specific routes/windows
		const currentPage = get(page);
		const pathname = currentPage?.route?.id || '';
		
		// Apply drag regions only for chatbar and desktop-specific components
		return pathname.includes('chatbar') || pathname.includes('desktop-app');
	} catch (error) {
		console.warn('Failed to detect Tauri drag region context:', error);
		return false;
	}
}

/**
 * Get the data-tauri-drag-region attribute conditionally
 */
export function getDragRegionAttr(): Record<string, boolean> | {} {
	return shouldUseDragRegion() ? { 'data-tauri-drag-region': true } : {};
}