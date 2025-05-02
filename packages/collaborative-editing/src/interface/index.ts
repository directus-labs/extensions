import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'presentation-collab-settings-interface',
	name: 'Collaboration',
	icon: 'arrow_selector_tool',
	description: 'Collaboration Settings',
	component: InterfaceComponent,
	options: null,
	hideLabel: true,
	hideLoader: true,
	autoKey: true,
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
});
