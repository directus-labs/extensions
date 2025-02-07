import { definePanel } from '@directus/extensions-sdk';
import PanelComponent from './panel.vue';

export default definePanel({
	id: 'flow-triggers-panel',
	name: 'Flows',
	description: 'Configure one or more flows to be triggered by a button.',
	icon: 'bolt',
	component: PanelComponent,
	options: [
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
	],
	minWidth: 12,
	minHeight: 8,
});
