import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'switch-interface',
	name: 'Switch',
	icon: 'toggle_on',
	description: 'Toggle switch for boolean fields.',
	component: InterfaceComponent,
	group: 'selection',
	options: [
		{
			field: 'label',
			name: '$t:label',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: '$t:interfaces.boolean.label_placeholder',
				},
			},
			schema: {
				default_value: '$t:interfaces.boolean.label_default',
			},
		},
		{
			field: 'description',
			name: '$t:description',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				options: {
					placeholder: 'Enter a description for this option',
				},
			},
		},
		{
			field: 'iconOn',
			name: '$t:icon_on',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'check',
			},
		},
		{
			field: 'iconOff',
			name: '$t:icon_off',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
			schema: {
				default_value: 'close',
			},
		},
		{
			field: 'colorOn',
			name: '$t:interfaces.boolean.color_on',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
		{
			field: 'colorOff',
			name: '$t:interfaces.boolean.color_off',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
	],
	types: ['boolean'],
	preview: `<svg width="156" height="96" viewBox="0 0 156 96" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path opacity="0.25" d="M132 35H24C20.6863 35 18 37.6863 18 41V55C18 58.3137 20.6863 61 24 61H132C135.314 61 138 58.3137 138 55V41C138 37.6863 135.314 35 132 35Z" fill="var(--theme--primary)"/>
	<path d="M111 52C113.209 52 115 50.2091 115 48C115 45.7909 113.209 44 111 44C108.791 44 107 45.7909 107 48C107 50.2091 108.791 52 111 52Z" fill="var(--theme--primary)"/>
	<path d="M54 42H28C26.8954 42 26 42.8954 26 44V46C26 47.1046 26.8954 48 28 48H54C55.1046 48 56 47.1046 56 46V44C56 42.8954 55.1046 42 54 42Z" fill="var(--theme--primary)"/>
	<path d="M54 52H28C26.8954 52 26 52.2985 26 52.6667V53.3333C26 53.7015 26.8954 54 28 54H54C55.1046 54 56 53.7015 56 53.3333V52.6667C56 52.2985 55.1046 52 54 52Z" fill="var(--theme--primary)"/>
	<path d="M78 42H62C60.8954 42 60 42.8954 60 44V46C60 47.1046 60.8954 48 62 48H78C79.1046 48 80 47.1046 80 46V44C80 42.8954 79.1046 42 78 42Z" fill="var(--theme--primary)"/>
	<path d="M78 52H62C60.8954 52 60 52.2985 60 52.6667V53.3333C60 53.7015 60.8954 54 62 54H78C79.1046 54 80 53.7015 80 53.3333V52.6667C80 52.2985 79.1046 52 78 52Z" fill="var(--theme--primary)"/>
	<rect x="104.5" y="41.5" width="26" height="13" rx="6.5" stroke="var(--theme--primary)"/>
	</svg>`,
});
