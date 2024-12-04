import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-address-completion-interface',
	name: 'Address completion',
	icon: 'box',
	description: 'Use Google Places autocomplete Data API as an Address Completion interface!',
	component: InterfaceComponent,
	options: [
		{
			field: 'apiKeyGMaps',
			name: 'Google Maps API Key',
			type: 'string',
			meta: {
				required: true,
				options: {
					masked: true,
				},
				width: 'full',
				interface: 'input',
			},
		},
		{
			field: 'iconLeft',
			name: '$t:icon_left',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'iconRight',
			name: '$t:icon_right',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'displayMap',
			name: 'Display map',
			type: 'boolean',
			meta: {
				required: true,
				width: 'half',
				interface: 'checkbox',
			},
			schema: {
				default_value: true,
			},
		},
		{
			field: 'autocompleteFetchOptions',
			name: 'Autocomplete Fetch Options',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'code',
				note: 'Check the [documentation](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteSuggestion.fetchAutocompleteSuggestions) for possible options',
			},
		}
	],
	types: ['json'],
});
