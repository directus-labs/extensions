import { defineDisplay } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';

export default defineDisplay({
	id: 'flow-trigger-display',
	name: 'Flow',
	description: 'Display a directus flow',
	icon: 'bolt',
	component: DisplayComponent,
	handler: (value) => {
		console.log('handler', { value });
		return value;
	},
	options: () => {
		return [
			{
				field: 'text',
				name: 'Button Text',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					note: 'Defaults to the flow name.',
					options: {
						placeholder: 'Button Text',
					},
				},
			},
			{
				field: 'icon',
				name: 'Button Icon',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
					note: 'Defaults to the flow icon.',
				},
			},
		];
	},
	types: ['uuid', 'string'],
	localTypes: ['m2o'],
});
