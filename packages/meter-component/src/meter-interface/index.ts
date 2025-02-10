import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'meter-interface',
	name: 'Meter',
	icon: 'thermometer',
	description: 'Displays a gauge meter for tracking progress.',
	component: InterfaceComponent,
	options: [
		{
			field: 'min',
			name: 'Minimum Value',
			type: 'decimal',
			default: 0,
			required: true,
			meta: {
				width: 'half',
			},
		},
		{
			field: 'max',
			name: 'Maximum Value',
			type: 'decimal',
			default: 100,
			required: true,
			meta: {
				width: 'half',
			},
		},
		{
			field: 'label',
			name: 'Label',
			type: 'string',
			default: '',
			required: false,
			meta: {
				note: 'The label to display below the meter.',
			},
		},
		{
			field: 'indicator',
			name: 'Indicator',
			type: 'boolean',
			default: false,
			required: false,
			meta: {
				interface: 'boolean',
				width: 'half',
				note: 'Show an indicator with the current value.',

			},
		},
		{
			field: 'color',
			name: 'Color',
			type: 'string',
			required: false,
			meta: {
				interface: 'select-color',
				note: 'The color of the meter bar. Defaults to the theme primary color.',
				width: 'half',
			},
		},
	],
	types: ['integer', 'float', 'decimal', 'bigInteger'],
});
