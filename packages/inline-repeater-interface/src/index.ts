import { defineInterface } from '@directus/extensions-sdk';
import InterfaceList from './list.vue';
import RepeaterOptions from './options.vue';

export default defineInterface({
	id: 'inline-repeater-interface',
	name: 'Inline Repeater',
	description: 'Create multiple items of the same structure that can be edited inline.',
	icon: 'format_line_spacing',
	component: InterfaceList,
	types: ['json'],
	group: 'selection',
	options: RepeaterOptions as any,
});
