import type { RestClient } from '@directus/sdk';
import type { Preset } from '@directus/types';
import type { DirectusError } from '../../types/extension';
import type { Schema } from '../api';
import { createPresets } from '@directus/sdk';

async function migratePresets({
	res,
	client,
	presets,
	selectedPresets,
	dry_run = false,
}: {
	res: any;
	client: RestClient<Schema>;
	presets: Preset[] | null;
	selectedPresets?: string[];
	dry_run: boolean;
}): Promise<{ response: string; name: string } | DirectusError> {
	if (!presets) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No presets found' }] };
	}

	// Issue #014: Handle empty selection = skip
	if (selectedPresets && selectedPresets.length === 0) {
		res.write('* Presets skipped (empty selection)\r\n\r\n');
		return { response: 'Skipped', name: 'Presets' };
	}

	// Issue #014: Filter by selected preset IDs
	let filteredPresets = presets;
	if (selectedPresets && selectedPresets.length > 0) {
		// Convert IDs to strings for comparison (presets use numeric IDs)
		const selectedIds = new Set(selectedPresets.map((id) => String(id)));
		filteredPresets = presets.filter((preset) => selectedIds.has(String(preset.id)));
		res.write(`* Filtering to ${filteredPresets.length} selected presets (from ${presets.length})\r\n\r\n`);
	}

	if (filteredPresets.length === 0) {
		res.write('* No presets to migrate\r\n\r\n');
		return { response: 'Empty', name: 'Presets' };
	}

	res.write(`* [Local] Found ${filteredPresets.length} presets\r\n\r\n`);

	try {
		res.write(filteredPresets.length > 0 ? `* [Remote] Uploading ${filteredPresets.length} ${filteredPresets.length > 1 ? 'Presets' : 'Preset'} ` : '* No Presets to migrate\r\n\r\n');

		const presetsToAdd = filteredPresets.map((preset) => {
			// Remove the id field from the presets so we don't have to reset the autoincrement on the db
			delete preset.id;
			const cleanPreset = { ...preset };
			cleanPreset.user = null;
			cleanPreset.role = null; // Null out role to prevent FK error when migrating without users
			return cleanPreset;
		});

		if (presetsToAdd.length > 0) {
			res.write('.');

			if (!dry_run) {
				await client.request(createPresets(presetsToAdd));
			}

			res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');
		}
		else {
			res.write('* No new presets to create\r\n\r\n');
		}

		res.write('* Preset Migration Complete\r\n\r\n');
		return { response: 'Success', name: 'Presets' };
	}
	catch (error) {
		const errorResponse = error as DirectusError;
		res.write('error\r\n\r\n');

		if (errorResponse.errors && errorResponse.errors.length > 0) {
			res.write(`${errorResponse.errors[0]?.message}\r\n\r\n`);
		}

		return errorResponse;
	}
}

export default migratePresets;
