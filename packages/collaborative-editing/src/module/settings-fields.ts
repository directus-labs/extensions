import type { DeepPartial, Field } from '@directus/types';

export const fields: DeepPartial<Field>[] = [
	{
		field: 'collaborativeEditingEnabled',
		type: 'boolean',
		name: 'Enable Collaborative Editing',
		meta: {
			interface: 'toggle',
			width: 'half',
		},
		schema: {
			default_value: true,
		},
	},
];
