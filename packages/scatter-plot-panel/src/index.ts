import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'panel-scatter-plot',
	name: 'Scatter Plot',
	icon: 'scatter_plot',
	description: 'Generate a Scatter plot from X,Y values!',
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
				field: 'series',
				type: 'string',
				name: '$t:series_grouping',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'xAxis',
				type: 'string',
				name: '$t:x_axis',
				required: true,
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						placeholder: '$t:select_a_field',
						typeAllowList: ['integer', 'bigInteger', 'float', 'decimal', 'dateTime', 'date', 'timestamp'],
					},
					width: 'half',
				},
			},
			{
				field: 'yAxis',
				type: 'string',
				name: '$t:y_axis',
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
				field: 'color',
				name: '$t:color',
				type: 'integer',
				schema: {
					default_value: 'var(--theme--primary)',
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
			{
				field: 'showAxisLabels',
				type: 'string',
				name: '$t:show_axis_labels',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								value: 'both',
								text: '$t:both',
							},
							{
								value: 'yAxis',
								text: '$t:show_y_only',
							},
							{
								value: 'xAxis',
								text: '$t:show_x_only',
							},
							{
								value: 'none',
								text: '$t:none',
							},
						],
					},
					width: 'half',
				},
				schema: {
					default_value: 'both',
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
		];
	},
	minWidth: 12,
	minHeight: 8,
});
