/**
 * Get the full API root URL from the current page href
 */
export function useWSUrl(): string {
	const route = window.location.href;
	const parts = route.split('/');

	const url = new URL(parts.slice(0, parts.indexOf('admin')).join('/') + '/');
	url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
	url.pathname = '/websocket';

	return url.toString();
}
