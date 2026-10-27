import type { useApi, useStores } from '@directus/extensions-sdk';
import type { Preset } from '@directus/types';
import { isEqual, minBy } from 'lodash-es';
import { isAdminFromStores } from './is-admin';

type Stores = ReturnType<typeof useStores>;

const FIELD = 'command_palette_settings';
const LAYOUT = 'command-palette';

// Directus 12 hides directus_settings.command_palette_settings from non-admins, but every app user can read global
// presets. Admins keep a copy of the settings in one. Without a collection, core never applies it to a collection or
// opens a layout for it.
const MIRROR = { collection: null, layout: LAYOUT, bookmark: null, user: null, role: null };

function isMirror(preset: Preset) {
	return Object.entries(MIRROR).every(([key, value]) => preset[key as keyof Preset] === value);
}

// Admins opening the app at the same time can each create a copy, so the oldest one is the copy.
function findMirror(stores: Stores): Preset | undefined {
	return minBy((stores.usePresetsStore().collectionPresets as Preset[]).filter(isMirror), 'id');
}

export function readPersistedSettings(stores: Stores): unknown {
	const settings = stores.useSettingsStore().settings as Record<string, unknown> | null;
	if (settings && FIELD in settings) return settings[FIELD];

	return findMirror(stores)?.layout_options?.[LAYOUT];
}

let queue: Promise<unknown> = Promise.resolve();

// Startup and a save can sync at the same time, so run one at a time to keep an older value from landing last.
export function syncSettingsMirror(stores: Stores, api: ReturnType<typeof useApi>) {
	const sync = queue.then(() => writeMirror(stores, api));
	queue = sync.catch(() => {});
	return sync;
}

function settingsValue(stores: Stores) {
	return (stores.useSettingsStore().settings as Record<string, unknown> | null)?.[FIELD];
}

async function writeMirror(stores: Stores, api: ReturnType<typeof useApi>) {
	if (!isAdminFromStores(stores) || settingsValue(stores) === undefined) return;

	const presetsStore = stores.usePresetsStore();

	// Another admin may have written a copy since this app loaded, so ask the server.
	const response = await api.get('/presets', {
		params: {
			filter: JSON.stringify(Object.fromEntries(Object.entries(MIRROR).map(([key, value]) =>
				[key, value === null ? { _null: true } : { _eq: value }]))),
			fields: 'id,layout_options',
			sort: 'id',
			limit: -1,
		},
	});

	// Read the settings after the lookup, so a save made meanwhile is the one copied.
	const value = settingsValue(stores);
	if (value === undefined) return;

	const [mirror, ...duplicates] = response.data.data as Preset[];
	const layoutOptions = { [LAYOUT]: value };

	if (!mirror) await presetsStore.create({ ...MIRROR, layout_options: layoutOptions });
	else if (!isEqual(mirror.layout_options?.[LAYOUT], value)) await presetsStore.update(mirror.id!, { layout_options: layoutOptions });

	if (duplicates.length > 0) await presetsStore.delete(duplicates.map((preset) => preset.id!));
}
