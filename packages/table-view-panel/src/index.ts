import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'directus-panel-table',
	name: 'Table View',
	icon: 'table',
	description: 'Output data in a table',
	component: PanelComponent,
	options: ({ options }): Array<object> => {
		const collection = options?.collection;

		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
				meta: {
					interface: 'system-collection',
					options: {
						includeSystem: true,
						includeSingleton: false,
					},
					required: true,
					width: 'full',
				},
			},
			{
				field: 'sort_field',
				type: 'string',
				name: '$t:sort_field',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						placeholder: '$t:primary_key',
						multiple: false,
					},
					required: false,
					width: 'half',
				},
			},
			{
				field: 'sort_direction',
				type: 'string',
				name: '$t:sort_direction',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								value: 'asc',
								text: '$t:sort_asc',
							},
							{
								value: 'desc',
								text: '$t:sort_desc',
							},
						],
					},
					required: false,
					width: 'half',
				},
				schema: {
					default_value: 'desc',
				},
			},
			{
				field: 'filter',
				type: 'json',
				name: '$t:filter',
				meta: {
					interface: 'system-filter',
					options: {
						collectionField: 'collection',
						relationalFieldSelectable: true,
					},
				},
			},
			{
				field: 'fields',
				type: 'csv',
				name: '$t:select_fields',
				meta: {
					interface: 'system-fields',
					options: {
						collectionName: collection,
					},
					required: true,
					width: 'full',
				},
			},
			{
				field: 'limit',
				type: 'integer',
				name: '$t:limit',
				meta: {
					interface: 'input',
					required: true,
					width: 'half',
				},
				schema: {
					default_value: 10,
				},
			},

		];
	},
	minWidth: 12,
	minHeight: 8,
});
