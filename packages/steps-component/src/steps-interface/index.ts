import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'steps-interface',
	name: 'Steps',
	icon: 'step',
	description: 'Displays a clickable list of steps that the user can follow to complete a task.',
	component: InterfaceComponent,
	options: [
		{
			field: 'choices',
			name: 'Steps',
			type: 'json',
			description: 'List of steps to display.',
			meta: {
				width: 'full',
				interface: 'list',
				options: {
					fields: [
						{
							field: 'text',
							name: 'Text',
							type: 'string',
							meta: {
								required: true,
								interface: 'input',
								width: 'half',
								note: 'The label to display.',
							},
						},
						{
							field: 'value',
							name: 'Value',
							description: 'The value of the step.',
							meta: {
								required: true,
								interface: 'input',
								width: 'half',
								note: 'The value that gets stored.',
							},
						},
						{
							field: 'icon',
							name: 'Icon',
							meta: {
								interface: 'select-icon',
								width: 'full',
								note: 'The icon to display. (Optional)',
							},
						},
					],
				},
			},
		},
	],
	types: ['string', 'integer'],
});
