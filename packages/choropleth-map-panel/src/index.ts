import { definePanel, useCollection, useStores } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';
import { computed } from 'vue';

export default definePanel({
	id: 'choropleth-map-panel',
	name: 'Choropleth Map',
	icon: 'globe_asia',
	description: 'Display your data divided into colored geographical areas.',
	component: PanelComponent,
	options: ({ options }) => {
		
		const { useFieldsStore } = useStores();
		const fieldsStore = useFieldsStore();

		const fieldType = computed(() => {
			return options?.collection && options?.aggregateField
				? fieldsStore.getField(options.collection, options.aggregateField)?.type
				: null;
		});

		const fieldIsNumber = computed(() =>
			fieldType.value ? ['integer', 'bigInteger', 'float', 'decimal'].includes(fieldType.value) : false,
		);

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
					width: 'half',
				},
			},
			{
				field: 'countryField',
				type: 'string',
				name: 'Country Field',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'aggregateField',
				type: 'string',
				name: 'Aggregated Field',
				meta: {
					interface: 'system-field',
					options: {
						collectionField: 'collection',
						allowPrimaryKey: true,
						allowNone: true,
					},
					width: 'half',
				},
			},
			{
				field: 'aggregateFunction',
				type: 'string',
				name: '$t:aggregate_function',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'Count',
								value: 'count',
								disabled: false,
							},
							{
								text: 'Count (Distinct)',
								value: 'countDistinct',
								disabled: false,
							},
							{
								divider: true,
							},
							{
								text: 'Average',
								value: 'avg',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Average (Distinct)',
								value: 'avgDistinct',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Sum',
								value: 'sum',
								disabled: !fieldIsNumber.value,
							},
							{
								text: 'Sum (Distinct)',
								value: 'sumDistinct',
								disabled: !fieldIsNumber.value,
							},
						],
					},
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
					},
				},
			},
			{
				field: 'styleDivider',
				type: 'alias',
				meta: {
					interface: 'presentation-divider',
					options: {
						icon: 'style',
						title: 'Style & Format',
					},
					special: ['alias', 'no-data'],
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'string',
				meta: {
					interface: 'select-color',
					display: 'color',
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 8,
});
