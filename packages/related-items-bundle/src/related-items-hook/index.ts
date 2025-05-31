import type { Field } from '@directus/types';
import { defineHook } from '@directus/extensions-sdk';
import { alias_field } from '../shared/alias-field';

export default defineHook(({ action }, { services }) => {
	const { FieldsService } = services;

	action('settings.update', async ({ collection, payload }, { accountability, schema }) => {
		if (collection === 'directus_settings' && 'related_items_collections' in payload) {
			const collections: string[] = payload.related_items_collections;

			const fieldService = new FieldsService({
				accountability,
				schema,
			});

			const fields: Field[] = await fieldService.readAll();
			const existingFields = fields.filter((f) => f.field === 'directus_related_items_alias');
			const existingFieldsToDelete = existingFields.filter((f) => !collections.includes(f.collection));

			existingFieldsToDelete.forEach(async (f) => {
				try {
					await fieldService.deleteField(f.collection, f.field);
				}
				catch (error) {
					console.error(error);
				}
			});

			collections.filter((c) => !existingFields.some((f) => f.collection === c)).forEach(async (c) => {
				try {
					await fieldService.createField(c, alias_field);
				}
				catch (error) {
					console.error(error);
				}
			});
		}
	});
});
