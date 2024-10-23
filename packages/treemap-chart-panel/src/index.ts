import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'panel-treemap-chart',
	name: 'Tree Map Chart',
	icon: 'dashboard',
	description: 'Generate a Treemap Chart from your data. Also known as a Cluster chart.',
	component: PanelComponent,
	options: ({ options }): Array<Object> => {
		const series = options?.["series"];
		return [
			{
				field: 'collection',
				type: 'string',
				name: '$t:collection',
				required: true,
				meta: {
					interface: 'system-collection',
					options: {
						includeSystem: true,
						includeSingleton: false,
						placeholder: '$t:select_a_collection',
					},
					width: 'full',
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
				field: 'dataLabels',
				type: 'string',
				name: '$t:displays.labels.labels',
				required: true,
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['string'],
					},
					width: 'half',
				},
			},
			{
				field: 'dataValues',
				type: 'string',
				name: '$t:panels.time_series.value_field',
				required: true,
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['integer', 'bigInteger', 'float', 'decimal'],
					},
					width: 'half',
				},
			},
			{
				field: 'labelGrouping',
				type: 'string',
				name: '$t:group_aggregation',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								value: 'max',
								text: '$t:max',
							},
							{
								value: 'min',
								text: '$t:min',
							},
							{
								value: 'avg',
								text: '$t:avg',
							},
							{
								value: 'sum',
								text: '$t:sum',
							},
							{
								value: 'count',
								text: '$t:count',
							},
						],
					},
					width: 'half',
				},
				schema: {
					default_value: 'sum',
				},
			},
			{
				field: 'series',
				type: 'string',
				name: '$t:series_grouping',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['string'],
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'showMarker',
				name: '$t:panels.linechart.show_marker',
				type: 'boolean',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'showDataLabel',
				name: '$t:show_data_label',
				type: 'boolean',
				schema: {
					default_value: true,
				},
				meta: {
					interface: 'boolean',
					width: 'half',
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'integer',
				schema: {
					default_value: '#6644FF',
				},
				meta: series ? {
					interface: 'presentation-notice',
					width: 'half',
					options: {
						text: '$t:theme_auto',
					},
				} : {
					interface: 'select-color',
					display: 'color',
					width: 'half',
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 8,
});
