import type { DeepPartial, Field } from '@directus/types';

export const system_field: DeepPartial<Field> = {
	field: 'related_items_collections',
	type: 'string',
	name: 'Related Items Collections',
	meta: {
		required: true,
		interface: 'system-collection',
		special: [
			'cast-json',
		],
		options: {
			includeSystem: true,
			includeSingleton: true,
			multiple: true,
			allowNone: true,
		},
		note: 'Select the collections to include the related items module.',
		width: 'half',
	},
};
