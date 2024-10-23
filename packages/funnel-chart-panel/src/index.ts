import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'panel-funnel-chart',
	name: 'Funnel Chart',
	icon: 'filter_list',
	description: 'Generate a Funnel Chart from your data',
	component: PanelComponent,
	options: [
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
			field: 'sortDirection',
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
			meta: {
				interface: 'select-color',
				display: 'color',
				width: 'half',
			},
		},
	],
	minWidth: 12,
	minHeight: 8,
});
