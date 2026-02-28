import type { DirectusSettings, RestClient } from '@directus/sdk';
import type { Settings } from '@directus/types';
import type { DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { readSettings, updateSettings } from '@directus/sdk';
import { createDefu } from 'defu';

const customDefu = createDefu((obj, key, value) => {
	if (Array.isArray(obj[key]) && Array.isArray(value)) {
		// @ts-expect-error-key
		obj[key] = mergeArrays(key, obj[key], value);
		return true;
	}

	if (typeof obj[key] === 'string' && typeof value === 'string') {
		// @ts-expect-error-key
		obj[key] = mergeJsonStrings(obj[key], value);
		return true;
	}
});

function mergeArrays(key: string, current: any[], incoming: any[]): any[] {
	const mergeKeys = {

		basemaps: ['key'],
		custom_aspect_ratios: ['key'],
		module_bar: ['id', 'type'],
		storage_asset_presets: ['key'],

	};

	const keys = mergeKeys[key as keyof typeof mergeKeys];
	if (!keys)
		return [...new Set([...current, ...incoming])];

	return current.concat(
		incoming.filter((item) => !current.some(
			(currentItem) => keys.every((k) => currentItem[k] === item[k]),
		)),
	);
}

function mergeJsonStrings(current: string, incoming: string): string {
	try {
		return JSON.stringify(customDefu(JSON.parse(current), JSON.parse(incoming)));
	}
	catch {
		return incoming; // If not valid JSON, return the incoming value
	}
}

async function migrateSettings({
	res,
	client,
	settings,
	selectedSettings,
	dry_run = false,
}: {
	res: any;
	client: RestClient<Schema>;
	settings: Settings | null;
	selectedSettings?: string[];
	dry_run: boolean;
}): Promise<{ response: string; name: string } | DirectusError> {
	res.write('* [Local] Loading Settings\r\n\r\n');

	// Issue #013: Handle empty selection = skip migration
	if (selectedSettings && selectedSettings.length === 0) {
		res.write('* Settings skipped (empty selection)\r\n\r\n');
		return { response: 'Skipped', name: 'Settings' };
	}

	try {
		const currentSettings = await client.request(readSettings());

		// Issue #013: Filter settings if selectedSettings provided
		let settingsToMerge = settings;
		if (selectedSettings && selectedSettings.length > 0 && settings) {
			const filteredSettings: Partial<Settings> = {};
			for (const field of selectedSettings) {
				if (field in settings) {
					(filteredSettings as any)[field] = (settings as any)[field];
				}
			}
			settingsToMerge = filteredSettings as Settings;
			res.write(`* Filtering to ${selectedSettings.length} selected field(s): ${selectedSettings.join(', ')}\r\n\r\n`);
		}

		const mergedSettings = customDefu(settingsToMerge, currentSettings) as DirectusSettings;

		if (!dry_run) {
			await client.request(updateSettings(mergedSettings));
		}

		res.write('* Settings Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Settings' };
	}
	catch (error) {
		console.error(error);
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export default migrateSettings;
