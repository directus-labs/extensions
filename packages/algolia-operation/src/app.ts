import { defineOperationApp } from '@directus/extensions-sdk';

const actions = [
	{
		text: "Add or replace a record",
		value: "add-or-replace"
	},
	{
		text: "Add or update attributes",
		value: "add-or-update-attributes"
	},
	{
		text: "Delete a record",
		value: "delete"
	},
	{
		text: "Retrieve a record",
		value: "retrieve"
	},
	{
		text: "Search",
		value: "search"
	}
];

export default defineOperationApp({
	id: 'algolia-operation',
	name: 'Algolia',
	icon: 'search',
	description: 'Use Algolia to index your Directus data.',
	overview: ({ index, action }) => [
		{
			label: 'Index',
			text: index
		},
		{
			label: 'Action',
			text: actions.find(item => item.value == action)?.text
		},
	],
	options: ({ action }) => {
		const fields: any = [
			{
				field: 'appID',
				name: 'Application ID',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						font: 'monospace',
						placeholder: 'Your Algolia application ID'
					}
				}
			},
			{
				field: 'apiKey',
				name: 'API Key',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						iconRight: 'key',
						font: 'monospace',
						placeholder: 'Your Algolia API key',
						masked: true
					}
				}
			},
			{
				field: 'index',
				name: 'Index',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						font: 'monospace',
						placeholder: 'Name of your index'
					}
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
						choices: actions
					}
				}
			}
		];

		const objectIdField = {
			field: 'objectID',
			name: 'Object ID',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					font: 'monospace',
					placeholder: '{{$trigger.key}}',
				},
			}
		};

		const bodyField = {
			field: 'body',
			name: 'Body',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json'
				}
			}
		};

		const paramsField = {
			field: 'params',
			name: 'Search Parameters',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				options: {
					language: 'json',
					template: '{ "query": "" }',
				}
			}
		};

		if (action == 'add-or-replace') {
			fields.push(objectIdField, bodyField);
		}

		if (action == 'add-or-update-attributes') {
			fields.push(objectIdField, bodyField);
		}

		if (action == 'delete') {
			fields.push(objectIdField);
		}

		if (action == 'retrieve') {
			fields.push(objectIdField);
		}

		if (action == 'search') {
			fields.push(paramsField);
		}

		return fields
	}
});
