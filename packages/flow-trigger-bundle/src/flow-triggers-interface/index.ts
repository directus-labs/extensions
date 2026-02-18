import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'flow-triggers-interface',
	name: 'Flows',
	description: 'Configure one or more flows to be triggered by a button.',
	icon: 'bolt',
	component: InterfaceComponent,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	options: ({ collection }) => {
		return [
			{
				field: 'triggers',
				name: 'Triggers',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						template: '{{ trigger.text }}',
						fields: [
							{
								field: 'trigger',
								name: 'Flow',
								type: 'json',
								collection,
								meta: {
									required: true,
									width: 'full',
									interface: 'system-flow-trigger-form',
									options: {
										nested: true,
									},
								},
							},
						],
					},
				},
			},
			{
				field: 'autoRefresh',
				name: 'Auto Refresh',
				type: 'boolean',
				meta: {
					interface: 'boolean',
					options: {
						label: 'Automatically refresh item data after flow completes',
					},
					width: 'full',
				},
				schema: {
					default_value: true,
				},
			},
		];
	},
});
