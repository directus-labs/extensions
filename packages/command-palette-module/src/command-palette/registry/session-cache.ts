import { refreshRegisteredCommands } from './register-commands';

type Entry = { status: 'loading' } | { status: 'loaded'; value: unknown } | { status: 'failed' };

let entries = new Map<string, Entry>();
let controller = new AbortController();

// Each palette opening starts fresh, so data like an item's versions is fetched once per opening and never goes stale.
export function startCommandSession() {
	controller.abort();
	controller = new AbortController();
	entries = new Map();
}

/**
 * Returns the value loaded for `key` in this palette session. The first call starts the request and returns
 * undefined; commands are refreshed once it lands. Results from an earlier session are dropped.
 */
export function getSessionValue<T>(key: string, load: (signal: AbortSignal) => Promise<T>): T | undefined {
	const entry = entries.get(key);
	if (entry) return entry.status === 'loaded' ? entry.value as T : undefined;

	const sessionEntries = entries;
	const { signal } = controller;
	sessionEntries.set(key, { status: 'loading' });

	load(signal).then(
		(value) => {
			if (signal.aborted) return;
			sessionEntries.set(key, { status: 'loaded', value });
			refreshRegisteredCommands();
		},
		(error) => {
			if (signal.aborted) return;
			console.warn(error);
			sessionEntries.set(key, { status: 'failed' });
		},
	);

	return undefined;
}
