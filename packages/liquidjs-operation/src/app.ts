import { getPublicURL } from '@directus-labs/utils';
import { defineOperationApp } from '@directus/extensions-sdk';

type FieldDefinition = any;

function getOperationOptions(currentValues: Record<string, any>): FieldDefinition[] {
	const publicUrl = getPublicURL();
	const { collection } = currentValues;

	const staticFields: FieldDefinition[] = [
		{
			field: 'mode',
			name: 'Template Mode',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Choose how to provide the Liquid template. Custom Template: write inline. Saved Template: use a template stored in a collection.',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Custom Template', value: 'custom' },
						{ text: 'Saved Template', value: 'saved' },
					],
				},
			},
			schema: { default_value: 'custom' },
		},
		{
			field: 'operationMode',
			name: 'Operation Mode',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Choose processing mode. Single: render one template with one data object. Batch: render the template multiple times, once for each item in an array of data objects.',
				interface: 'select-dropdown',
				options: {
					choices: [
						{ text: 'Single', value: 'single' },
						{ text: 'Batch', value: 'batch' },
					],
				},
			},
			schema: { default_value: 'single' },
		},
		{
			field: 'publicUrl',
			name: 'PublicUrl',
			type: 'string',
			meta: {
				interface: 'input',
				hidden: true,
				readonly: true,
			},
			schema: { default_value: publicUrl },
		},
	];

	const dynamicFields: FieldDefinition[] = [
		{
			field: 'template',
			name: 'Template',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'input-code',
				note: 'Enter your Liquid template here. Use {# #} for output tags instead of {{ }}. All other Liquid tags remain unchanged. Example: `Hello, {# user.name #}! {% if user.admin %}Admin area{% endif %}`',
				options: {
					language: 'htmlmixed',
					template: 'Hello, {# first_name #}! {% if is_admin %}Welcome to the Admin.{% endif %}',
					placeholder: 'Hello, {# first_name #}! {% if is_admin %}Welcome to the Admin.{% endif %}',
				},
				hidden: true, // Default to hidden
				conditions: [{ hidden: false, rule: { mode: { _eq: 'custom' } } }], // Show when mode is 'custom'
			},
			schema: { default_value: '' },
		},
		{
			field: 'collection',
			name: 'Collection',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Select the collection containing your saved Liquid templates.',
				interface: 'system-collection',
				hidden: true,
				conditions: [{ hidden: false, rule: { mode: { _eq: 'saved' } } }], // Show when mode is 'saved'
			},
			schema: { default_value: null },
		},
		{
			field: 'item',
			name: 'Item',
			type: 'string',
			meta: {
				width: 'half',
				note: 'Choose the specific template to render from the selected collection.',
				interface: 'collection-item-dropdown',
				options: {
					selectedCollection: collection || null,
					valueField: 'id',
				},
				hidden: true,
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [
								{ mode: { _eq: 'saved' } },
								{ collection: { _nempty: true } },
								{ collection: { _nnull: true } },
							],
						},
					},
				],
			},
			schema: { default_value: null },
		},
		{
			field: 'fields',
			name: 'Fields',
			type: 'json',
			meta: {
				width: 'half',
				note: 'Choose fields to process and render. Only selected fields appear in output. Ideal for email scenarios with dynamic subject and body.',
				interface: 'system-field-tree',
				options: {
					collectionField: 'collection',
				},
				hidden: true,
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [
								{ mode: { _eq: 'saved' } },
								{ collection: { _nempty: true } },
								{ collection: { _nnull: true } },
							],
						},
					},
				],
			},
			schema: { default_value: [] },
		},
		{
			field: 'accessToken',
			name: 'Access Token',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				note: 'Required for accessing private template collections in `Saved Template` mode. Alternatively, make your template collection public. Ensure the token has read permissions for the template collection.',
				options: {
					masked: true,
				},
				hidden: true,
				conditions: [{ hidden: false, rule: { mode: { _eq: 'saved' } } }],
			},
			schema: { default_value: null },
		},
		{
			field: 'data',
			name: 'Data',
			type: 'json',
			meta: {
				width: 'full',
				note: 'JSON data to populate the template. Format: object for single mode, array of objects for batch mode. Supports mustache syntax for dynamic values, e.g., {"user": "{{$trigger.user}}"}.',
				interface: 'input-code',
				options: {
					language: 'json',
					template: '{"first_name":"John","last_name":"Doe","is_admin":true}',
					placeholder: '{"first_name":"John","last_name":"Doe","is_admin":true}',
				},
			},
			schema: { default_value: {} },
		},
		{
			field: 'dataReturnFields',
			name: 'Return Fields from Data',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'tags',
				note: 'Specify fields from your input data to include in each output object. Useful for maintaining context or identification (e.g., "id", "name"). These fields will be added alongside the output for each item in batch mode.',
				options: {
					placeholder: 'Add a field key and press Enter...',
				},
				hidden: true,
				conditions: [{ hidden: false, rule: { operationMode: { _eq: 'batch' } } }], // Show when operationMode is 'batch'
			},
			schema: { default_value: [] },
		},
	];

	return [...staticFields, ...dynamicFields];
}

export default defineOperationApp({
	id: 'liquidjs-operation',
	name: 'Liquid Template',
	icon: 'water_drop',
	description: 'Render dynamic content using Liquid templates.',
	overview: ({ text }) => [
		{
			label: 'Text',
			text: String(text ?? ''),
		},
	],
	options: (options: Record<string, any>) => getOperationOptions(options),
});
