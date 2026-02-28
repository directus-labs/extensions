import type { RestClient } from '@directus/sdk';
import type { DirectusError, Translation } from '../../types/extension';
import type { Schema } from '../api';
import { createTranslations, readTranslations } from '@directus/sdk';

async function migrateTranslations({
	res,
	client,
	translations,
	selectedLanguages,
	translationKeyPattern,
	dry_run = false,
}: {
	res: any;
	client: RestClient<Schema>;
	translations: Translation[] | null;
	selectedLanguages?: string[];
	translationKeyPattern?: string;
	dry_run: boolean;
}): Promise<{ response: string; name: string } | DirectusError> {
	if (!translations) {
		res.write('* Couldn\'t read data from extract\r\n\r\n');
		return { name: 'Directus Error', status: 404, errors: [{ message: 'No translations found' }] };
	}

	// Issue #013: Handle empty language selection = skip migration
	if (selectedLanguages && selectedLanguages.length === 0) {
		res.write('* Translations skipped (empty language selection)\r\n\r\n');
		return { response: 'Skipped', name: 'Translations' };
	}

	// Issue #013: Filter by selected languages
	let filteredTranslations = translations;
	if (selectedLanguages && selectedLanguages.length > 0) {
		filteredTranslations = translations.filter((t) => selectedLanguages.includes(t.language));
		res.write(`* Filtering to languages: ${selectedLanguages.join(', ')}\r\n\r\n`);
	}

	// Issue #013: Filter by key pattern
	if (translationKeyPattern) {
		try {
			const regex = new RegExp(translationKeyPattern);
			filteredTranslations = filteredTranslations.filter((t) => regex.test(t.key));
			res.write(`* Filtering by key pattern: ${translationKeyPattern}\r\n\r\n`);
		}
		catch (e) {
			res.write(`* Invalid key pattern regex: ${translationKeyPattern}\r\n\r\n`);
		}
	}

	if (filteredTranslations.length === 0) {
		res.write('* No Translations match filter criteria\r\n\r\n');
		return { response: 'Empty', name: 'Translations' };
	}

	res.write(`* [Local] Found ${filteredTranslations.length} translations (filtered from ${translations.length})\r\n\r\n`);

	try {
		// Fetch existing translations
		const existingTranslations = await client.request(readTranslations({
			limit: -1,
		}));

		const existingTranslationKeys = new Set(existingTranslations.map((t) => `${t.language}_${t.key}`));

		const newTranslations = filteredTranslations.filter((t) => {
			const key = `${t.language}_${t.key}`;

			if (existingTranslationKeys.has(key)) {
				return false;
			}

			return true;
		});

		res.write(newTranslations.length > 0 ? `* [Remote] Uploading ${newTranslations.length} ${newTranslations.length > 1 ? 'Translations' : 'Translation'} ` : '* No Translations to migrate\r\n\r\n');

		if (newTranslations.length > 0) {
			res.write('.');

			if (!dry_run) {
				await client.request(createTranslations(newTranslations));
			}
		}

		res.write(dry_run ? 'skipped\r\n\r\n' : 'done\r\n\r\n');

		res.write('* Translations Migration Complete\r\n\r\n');

		return { response: 'Success', name: 'Translations' };
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

export default migrateTranslations;
