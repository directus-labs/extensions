import { defineOperationApp } from '@directus/extensions-sdk';
import schema from './schema';

export default defineOperationApp({
	id: 'elasticsearch-operation',
	name: 'Elastic Search Operation',
	icon: 'search',
	description: 'Index Directus content into Elastic Search.',
	overview: ({ search_index, action, }) => [
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

		const action = options?.['action'];

		return [
			{
				field: 'host',
				name: 'Host URL',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: 'http://localhost:9200',
					},
					note: 'The ElasticSearch URL.',
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
					note: 'The API key ID for your instance. This can be created within the [Cloud Project](https://www.elastic.co/guide/en/kibana/current/api-keys.html) and leave the key unrestricted.',
					required: true,
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
					required: true,
				}
			},
			{
				field: 'document',
				name: 'Item Data',
				type: 'json',
				meta: ['create','update'].includes(action) ? {
					width: 'full',
					interface: 'input-code',
					note: 'The item object to create in the search index.',
					options: {
						language: 'json',
						placeholder: JSON.stringify(schema.create, null, 2),
						template: JSON.stringify(schema.create),
					},
					required: true,
				} : {
					width: 'full',
					interface: 'presentation-notice',
					options: {
						icon: false,
						text: 'Document not required.',
					},
				},
			},
		];
	},
});
