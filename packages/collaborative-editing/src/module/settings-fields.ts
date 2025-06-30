import type { DeepPartial, Field } from '@directus/types';

export const fields: DeepPartial<Field>[] = [
	{
		field: 'enabled_globally',
		type: 'boolean',
		name: 'Enable Collaborative Editing Globally',
		meta: {
			interface: 'toggle',
			width: 'half',
		},
		schema: {
			default_value: true,
		},
	},
	/*{
		field: 'collections',
		type: 'json',
		meta: {
			interface: 'list',
			special: ['cast-json'],
			options: {
				icon: 'book',
				fields: <DeepPartial<Field[]>>[
					{
						field: 'collection',
						type: 'string',
						name: '$t:collection',
						meta: {
							required: false,
							interface: 'system-collection',
							options: {
								includeSystem: false,
								includeSingleton: false,
							},
							note: 'Enable collaborative editing for this collection.',
							width: 'half',
						},
					},
				],
				addLabel: 'Add Collection',
			},
			note: 'Enable collaborative editing for the selected collections.',
		},
	},*/
];
