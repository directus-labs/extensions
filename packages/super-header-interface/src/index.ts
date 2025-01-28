import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'super-header',
	name: 'Super Header',
	icon: 'exercise',
	description:
		'Create a header with a title, subtitle, help information, and/or actions to help users navigate or run Flows.',
	component: InterfaceComponent,
	options: (context) => [
		{
			field: 'title',
			name: 'Title',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				options: {
					collectionName: context.collection,
				},
				note: 'Enter a title, or leave it blank to only show a line. You can also include fields from the current item. NOTE: this interface ONLY supports root level fields, it does NOT support showing relational fields.',
			},
		},
		{
			field: 'color',
			name: 'Color',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-color',
				note: 'Select a color for the title and icon.',
				options: {},
			},
		},
		{
			field: 'icon',
			name: 'Icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
				note: 'Select an icon to display next to the title.',
			},
		},
		{
			field: 'subtitle',
			name: 'Subtitle',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'system-display-template',
				options: {
					collectionName: context.collection,
				},
				note: 'Enter a subtitle for additional context. You can also include fields from the current item. NOTE: this interface ONLY supports root level fields, it does NOT support showing relational fields.',
			},
		},
		{
			field: 'help',
			name: 'Help',
			type: 'text',
			meta: {
				width: 'full',
				note: 'Add help information to guide users. Supports HTML.',
				interface: 'input-rich-text-html',
			},
		},
		{
			field: 'actions',
			name: 'Actions',
			type: 'json',
			meta: {
				interface: 'list',
				note: 'Add actions to the divider to help users navigate or run Flows.  If there are more than one action, actions will be displayed in a dropdown menu.',
				options: {
					fields: [
						{
							field: 'label',
							type: 'string',
							name: 'label',
							meta: {
								width: 'full',
								interface: 'system-input-translated-string',
								note: 'What the user will see on the button.',
								options: {
									placeholder: 'label',
								},
							},
						},
						{
							field: 'icon',
							name: 'icon',
							type: 'string',
							meta: {
								width: 'half',
								note: 'Select an icon to display next to the label.',
								interface: 'select-icon',
							},
						},
						{
							field: 'type',
							name: 'type',
							type: 'string',
							meta: {
								width: 'half',
								note: 'Select a type to style the button.',
								interface: 'select-dropdown',
								default_value: 'normal',
								options: {
									choices: [
										{ text: 'Primary', value: 'normal' },
										{ text: 'Secondary', value: 'secondary' },
										{ text: 'Info', value: 'info' },
										{ text: 'Success', value: 'success' },
										{ text: 'Warning', value: 'warning' },
										{ text: 'Danger', value: 'danger' },
									],
								},
							},
							schema: {
								default_value: 'normal',
							},
						},
						{
							field: 'actionType',
							name: 'Action Type',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-dropdown',
								note: 'Select the action type.',
								options: {
									choices: [
										{ text: 'Link', value: 'link' },
										{ text: 'Flow', value: 'flow' },
									],
								},
							},
							schema: {
								default_value: 'link',
							},
						},
						{
							field: 'url',
							type: 'string',
							name: '$t:url',
							meta: {
								width: 'full',
								interface: 'system-display-template',
								note: 'Enter a URL to navigate to when the button is clicked. You can include fields from the current item as variables. For example: https://example.com/articles/{{ id }}/{{ slug }}. NOTE: this interface ONLY supports root level fields, it does NOT support showing relational fields.',
								options: {
									collectionName: context.collection,
									font: 'monospace',
									placeholder: 'https://example.com/articles/{{ id }}/{{ slug }}',
								},
								hidden: true,
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'link',
											},
										},
										hidden: false,
									},
								],
							},
						},
						{
							field: 'flow',
							type: 'string',
							name: 'Flow',
							meta: {
								width: 'full',
								interface: 'collection-item-dropdown',
								note: 'Select a Flow to run when the button is clicked.',
								hidden: true,
								options: {
									selectedCollection: 'directus_flows',
									placeholder: 'Select a flow',
									template: '{{ name }}',
									filter: {
										trigger: {
											_eq: 'manual',
										},
									},
								},
								conditions: [
									{
										rule: {
											actionType: {
												_eq: 'flow',
											},
										},
										hidden: false,
									},
								],
							},
						},
					],
				},
			},
		},
	],
	types: ['alias'],
	localTypes: ['presentation'],
	group: 'presentation',
	autoKey: true,
	hideLabel: true,
});
