import type { DeepPartial, Field } from '@directus/types';

export const fields: DeepPartial<Field>[] = [
	{
		field: 'dividerGlobalSearch',
		type: 'alias',
		meta: {
			interface: 'presentation-divider',
			options: {
				title: 'Search',
				icon: 'search',
			},
		},
	},
	{
		name: 'Search Mode',
		field: 'searchMode',
		type: 'string',
		meta: {
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: 'As You Type', value: 'as_you_type' },
					{ text: 'On Submit', value: 'on_submit' },
				],
			},
			note: 'The search mode determines when the search is triggered. "As You Type" will search as the user types, "On Submit" will search when the search is submitted.',
			required: true,
		},
		schema: {
			default_value: 'as_you_type',
		},
	},
	{
		name: '$t:collections',
		field: 'collections',
		type: 'json',
		meta: {
			interface: 'list',
			options: {
				fields: <DeepPartial<Field[]>>[
					{
						field: 'collection',
						type: 'string',
						name: '$t:collection',
						meta: {
							required: true,
							interface: 'system-collection',
							options: {
								includeSystem: true,
								includeSingleton: false,
							},
							note: 'Select the collection to search through.',
							width: 'full',
						},
					},
					{
						field: 'displayTemplate',
						type: 'string',
						name: 'Display Template',
						meta: {
							interface: 'system-display-template',
							options: {
								collectionField: 'collection',
							},
							note: 'The template used to display search results. Use double curly braces to insert field values. For example, "{{name}}".',
							collection: 'products',
						},
					},
					{
						field: 'descriptionField',
						type: 'string',
						name: 'Description Field',
						meta: {
							interface: 'system-field',
							options: {
								collectionField: 'collection',
							},
							note: 'The field used to display a description of the search result.',
						},
					},
					{
						field: 'fields',
						type: 'json',
						name: 'Fields to Search',
						meta: {
							interface: 'system-field-tree',
							options: {
								collectionField: 'collection',
							},
							note: 'Select the fields to search through.',
						},
					},
					{
						field: 'filter',
						type: 'json',
						name: 'Filter',
						meta: {
							interface: 'system-filter',
							options: {
								collectionField: 'collection',
							},
							note: 'Add a filter to limit the search results.',
						},
					},
					{
						field: 'limit',
						type: 'integer',
						name: 'Number of Results',
						meta: {
							interface: 'input',
							width: 'half',
							note: 'The maximum number of search results to return. It is recommended to keep this number low to improve performance.',
						},
						schema: {
							default_value: 10,
						},
					},
					{
						field: 'sort',
						type: 'string',
						name: 'Sort By',
						meta: {
							interface: 'system-field',
							options: {
								collectionField: 'collection',
							},
							note: 'Sort the search results by a field.',
							width: 'half',
						},
					},
					{
						field: 'availableGlobally',
						type: 'boolean',
						name: 'Available Globally',
						meta: {
							hidden: true, // Option not available for now
							interface: 'toggle',
							width: 'half',
							note: 'Make this collection available to global search in the command palette without entering the "Search Collection..." command. This can impact the overall performance.',
						},
						schema: {
							default_value: false,
						},
					},
				],
				collection: 'products',
				addLabel: 'Add Collection',
			},
			note: 'Add collections to search through. Each collection can have its own search configuration.',
		},
	},
	{
		field: 'triggerRate',
		type: 'integer',
		name: 'Trigger Rate',
		meta: {
			interface: 'input',
			width: 'half',
			note: 'The *As You Type* mode is debounced for performance. This setting controls the rate at which the search is triggered.  Smaller values will trigger the search more often. In milliseconds. Default is 100ms',
		},
	},
	{
		field: 'dividerCommandPalette',
		type: 'alias',
		meta: {
			interface: 'presentation-divider',
			options: {
				title: 'Command Palette',
				icon: 'terminal',
			},
		},
	},
	{
		field: 'commandPaletteEnabled',
		type: 'boolean',
		name: 'Command Palette',
		meta: {
			interface: 'toggle',
			width: 'half',
		},
		schema: {
			default_value: true,
		},
	},
];
