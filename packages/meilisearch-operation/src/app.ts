import { defineOperationApp } from '@directus/extensions-sdk';
import schema from './schema';

export default defineOperationApp({
	id: 'meilisearch-operation',
	name: 'Meilisearch Operation',
	icon: 'search',
	description: 'Index Directus content into Meilisearch.',
	overview: ({ search_index, action }) => [
		{
			label: 'Index',
			text: search_index,
		},
		{
			label: 'Action',
			text: action,
		},
	],
	options: (options): Array<object> => {
		const action: 'create' | 'read' | 'update' | 'delete' = options?.['action'];

		return [
			{
				field: 'host',
				name: 'Host URL',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: 'http://127.0.0.1:7700',
					},
					note: 'The Meilisearch URL.',
					required: true,
				},
			},
			{
				field: 'api_key',
				name: 'API Key',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						masked: true,
					},
				},
			},
			{
				field: 'search_index',
				name: 'Index',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '{{$trigger.collection}}',
					},
					note: 'Index identifier',
					required: true,
				},
			},
			{
				field: 'action',
				name: 'Action',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: 'Create', value: 'create', icon: 'add' },
							{ text: 'Read', value: 'read', icon: 'visibility' },
							{ text: 'Update', value: 'update', icon: 'edit' },
							{ text: 'Delete', value: 'delete', icon: 'delete' },
						],
					},
					required: true,
				},
			},
			{
				field: 'document_id',
				name: 'Item ID',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					note: 'The item id for this document',
					options: {
						disabled: action === 'read' && options?.['document'],
					},
					required: action !== 'read',
				},
			},
			{
				field: 'document',
				name: action === 'read' ? 'Query' : 'Item Data',
				type: 'json',
				meta: ['create', 'update', 'read'].includes(action)
					? {
							width: 'full',
							interface: 'input-code',
							note: 'The item object to create in the search index.',
							options: {
								language: 'json',
								placeholder: JSON.stringify(schema[action], null, 2),
								template: JSON.stringify(schema[action]),
							},
							required: action !== 'read',
						}
					: {
							hidden: true,
						},
			},
		];
	},
});
