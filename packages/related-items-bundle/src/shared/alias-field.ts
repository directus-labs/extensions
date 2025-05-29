import type { DeepPartial, Field } from '@directus/types';

export const alias_field: DeepPartial<Field> = {
	field: 'directus_related_items_alias',
	type: 'alias',
	meta: {
		interface: 'related-items-interface',
		translations: [
			{
				language: 'en-US',
				translation: 'Related Items',
			},
		],
		width: 'full',
	},
};
