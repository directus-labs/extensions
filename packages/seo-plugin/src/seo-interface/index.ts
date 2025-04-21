import { defineInterface } from '@directus/extensions-sdk';
import InterfaceSeo from './interface.vue';

export default defineInterface({
	id: 'seo-interface',
	name: 'SEO Interface',
	description: 'Comprehensive SEO metadata management interface',
	icon: 'search',
	component: InterfaceSeo,
	types: ['json'],
	group: 'standard',
	options: ({ collection }) => [
		{
			field: 'titleTemplate',
			name: 'SEO Title Template',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				required: false,
				options: {
					collectionName: collection,
					font: 'monospace',
					placeholder: '{{title}} | My Website',
				},
				note: 'Define how page titles should be formatted. Use {{field}} to include dynamic content.',
			},
		},
		{
			field: 'descriptionTemplate',
			name: 'Meta Description Template',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				required: false,
				options: {
					collectionName: collection,
					font: 'monospace',
					placeholder: '{{description}}',
				},
				note: 'Template for meta descriptions. Use {{field}} to include dynamic content.',
			},
		},
		{
			field: 'showOgImage',
			name: 'Social Media Image',
			type: 'boolean',
			meta: {
				note: 'Adds an Open Graph image field for social media sharing',
				width: 'full',
			},
			schema: {
				default_value: false,
			},
		},
		{
			name: 'Additional SEO Fields',
			field: 'divider-meta',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				width: 'full',
				options: {
					title: 'Additional SEO Fields',
					inlineTitle: true,
				},

			},
		},
		{
			field: 'showFocusKeyphrase',
			name: 'Focus Keyphrase',
			type: 'boolean',
			meta: {
				note: 'Adds a focus keyphrase field for SEO optimization',
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},

		{
			field: 'showSearchControls',
			name: 'Search Engine Controls',
			type: 'boolean',
			meta: {
				note: 'Adds controls for no-index and no-follow tags',
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'showSitemap',
			name: 'Sitemap Controls',
			type: 'boolean',
			meta: {
				note: 'Adds fields for sitemap configuration',
				width: 'half',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'divider-focus-keyphrase',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				width: 'full',
				options: {
					title: 'Focus Keyphrase',
					inlineTitle: true,
				},
				hidden: true,
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showFocusKeyphrase: { _eq: true } }],
						},
					},
				],
			},

		},
		{
			field: 'slugField',
			name: 'Slug Field',
			type: 'string',
			meta: {
				width: 'half',
				note: 'What field contains the slug for this collection?',
				hidden: true,
				interface: 'system-field',
				options: {
					collectionName: collection,
				},
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showFocusKeyphrase: { _eq: true } }],
						},
					},
				],
			},
		},
		{
			field: 'contentFields',
			name: 'Content Fields',
			type: 'csv',
			meta: {
				width: 'half',
				interface: 'system-fields',
				hidden: true,
				note: 'What fields contain the content that you want to analyze for the focus keyphrase?',
				options: {
					collectionName: collection,

				},

				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showFocusKeyphrase: { _eq: true } }],
						},
					},
				],
			},
		},
		{
			field: 'divider-sitemap',
			type: 'alias',
			meta: {
				interface: 'presentation-divider',
				width: 'full',
				options: {
					title: 'Sitemap Defaults',
					inlineTitle: true,
				},
				hidden: true,
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showSitemap: { _eq: true } }],
						},
					},
				],
			},

		},
		{
			field: 'defaultChangeFrequency',
			name: 'Default Change Frequency',
			type: 'string',
			meta: {
				note: 'Default change frequency for items in this collection',
				width: 'half',
				interface: 'select-dropdown',
				hidden: true,
				options: {
					choices: [
						{ text: 'Always', value: 'always' },
						{ text: 'Hourly', value: 'hourly' },
						{ text: 'Daily', value: 'daily' },
						{ text: 'Weekly', value: 'weekly' },
						{ text: 'Monthly', value: 'monthly' },
						{ text: 'Yearly', value: 'yearly' },
						{ text: 'Never', value: 'never' },
					],
				},
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showSitemap: { _eq: true } }],
						},
					},
				],
			},
			schema: {
				default_value: 'weekly',
			},
		},
		{
			field: 'defaultPriority',
			name: 'Default Priority',
			type: 'string',
			meta: {
				note: 'Default priority for items in this collection (0.0 to 1.0)',
				width: 'half',
				interface: 'select-dropdown',
				hidden: true,
				options: {
					choices: [
						{ text: 'Very High (1.0)', value: '1.0' },
						{ text: 'High (0.8)', value: '0.8' },
						{ text: 'Medium (0.5)', value: '0.5' },
						{ text: 'Low (0.3)', value: '0.3' },
						{ text: 'Very Low (0.1)', value: '0.1' },
					],
				},
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showSitemap: { _eq: true } }],
						},
					},
				],
			},
			schema: {
				default_value: '0.5',
			},
		},
		{
			meta: {
				interface: 'presentation-divider',
				width: 'full',
				hidden: true,
				conditions: [
					{
						hidden: false,
						rule: {
							_and: [{ showSitemap: { _eq: true } }],
						},
					},
				],
			},
		},
		{
			field: 'additionalFields',
			name: 'Custom SEO Fields',
			type: 'json',
			meta: {
				interface: 'list',
				note: 'Define additional custom SEO fields',
				options: {
					collection,
					fields: additionalFields({ collection: collection || '' }),
				},
				width: 'full',
				required: true,
			},
		},
	],
});

function additionalFields({ collection }: { collection: string }) {
	return [
		{
			name: '$t:field',
			field: 'field',
			type: 'string',
			meta: {
				interface: 'input',
				width: 'half',
				sort: 2,
				required: true,
				options: {
					dbSafe: true,
					font: 'monospace',
					placeholder: '$t:field_name_placeholder',
				},
			},
		},
		{
			name: '$t:field_width',
			field: 'width',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				sort: 3,
				options: {
					choices: [
						{
							value: 'half',
							text: '$t:half_width',
						},
						{
							value: 'full',
							text: '$t:full_width',
						},
					],
				},
			},
		},
		{
			name: '$t:type',
			field: 'type',
			type: 'string',
			meta: {
				interface: 'select-dropdown',
				width: 'half',
				sort: 4,
				options: {
					choices: [
						{
							text: '$t:string',
							value: 'string',
						},
						{
							text: '$t:text',
							value: 'text',
						},
						{ divider: true },
						{
							text: '$t:boolean',
							value: 'boolean',
						},
						{ divider: true },
						{
							text: '$t:integer',
							value: 'integer',
						},
						{
							text: '$t:bigInteger',
							value: 'bigInteger',
						},
						{
							text: '$t:float',
							value: 'float',
						},
						{
							text: '$t:decimal',
							value: 'decimal',
						},
						{ divider: true },
						{
							text: '$t:geometry.All',
							value: 'geometry',
						},
						{ divider: true },
						{
							text: '$t:timestamp',
							value: 'timestamp',
						},
						{
							text: '$t:datetime',
							value: 'dateTime',
						},
						{
							text: '$t:date',
							value: 'date',
						},
						{
							text: '$t:time',
							value: 'time',
						},
						{ divider: true },
						{
							text: '$t:json',
							value: 'json',
						},
						{
							text: '$t:csv',
							value: 'csv',
						},
						{
							text: '$t:uuid',
							value: 'uuid',
						},
						{
							text: '$t:hash',
							value: 'hash',
						},
					],
				},
			},
		},
		{
			name: '$t:required',
			field: 'required',
			type: 'boolean',
			meta: {
				interface: 'boolean',
				sort: 5,
				options: {
					label: '$t:requires_value',
				},
				width: 'half',
			},
		},
		{
			name: '$t:note',
			field: 'note',
			type: 'string',
			meta: {
				interface: 'system-input-translated-string',
				width: 'full',
				sort: 6,
				options: {
					placeholder: '$t:interfaces.list.field_note_placeholder',
				},
			},
		},
		{
			name: '$t:interfaces.list.interface_group',
			field: 'group-interface',
			type: 'alias',
			meta: {
				interface: 'group-detail',
				field: 'group-interface',
				width: 'full',
				sort: 7,
				options: {
					start: 'open',
				},
				collection,
				special: ['group', 'no-data', 'alias'],
			},
		},
		{
			name: '$t:interface_label',
			field: 'interface',
			type: 'string',
			meta: {
				interface: 'system-interface',
				width: 'half',
				sort: 8,
				group: 'group-interface',
				options: {
					typeField: 'type',
				},
			},
		},
		{
			name: '$t:interface_options',
			field: 'options',
			type: 'string',
			meta: {
				interface: 'system-interface-options',
				width: 'full',
				sort: 9,
				group: 'group-interface',
				options: {
					interfaceField: 'interface',
				},
			},
		},
		{
			name: '$t:interfaces.list.display_group',
			field: 'group-display',
			type: 'alias',
			meta: {
				interface: 'group-detail',
				field: 'group-display',
				width: 'full',
				sort: 10,
				options: {
					start: 'closed',
				},
				collection,
				special: ['group', 'no-data', 'alias'],
			},
		},
		{
			name: '$t:display_label',
			field: 'display',
			type: 'string',
			meta: {
				interface: 'system-display',
				width: 'half',
				group: 'group-display',
				sort: 11,
				options: {
					typeField: 'type',
				},
			},
		},
		{
			name: '$t:display_options',
			field: 'display_options',
			type: 'string',
			meta: {
				interface: 'system-display-options',
				width: 'full',
				group: 'group-display',
				sort: 12,
				options: {
					displayField: 'display',
				},
			},
		},
	];
}
