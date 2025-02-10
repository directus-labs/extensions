import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'simple-list',
	name: 'List',
	icon: 'list',
	description: 'Input a simple list of items with full keyboard support.',
	component: InterfaceComponent,
	types: ['csv', 'json'],
	group: 'standard',
	options: [
		{
			field: 'size',
			type: 'string',
			name: 'Size',
			meta: {
				width: 'half',
				interface: 'select-dropdown',
				note: 'Control the size of the list item input field.',
				options: {
					choices: [
						{ value: 'small', text: 'Small' },
						{ value: 'normal', text: 'Normal' },
					],
				},
			},
			schema: {
				default_value: 'normal',
			},
		},
		{
			field: 'limit',
			type: 'integer',
			name: 'Limit',
			meta: {
				width: 'half',
				interface: 'input',
				note: 'Limit the number of items that can be added to the list. Leave blank for unlimited.',
			},
		},
		{
			field: 'addLabel',
			type: 'string',
			name: 'Add New Label',
			meta: {
				width: 'full',
				interface: 'system-input-translated-string',
				note: 'Customize the label for the "Add New" button.',
				placeholder: 'Add New Item',
			},
		},
	],
	preview: `<svg width="156" height="96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M132.444 9h-108a6 6 0 0 0-6 6v10a6 6 0 0 0 6 6h108a6 6 0 0 0 6-6V15a6 6 0 0 0-6-6Z" fill="var(--theme--background)"/><path d="M132.444 10h-108a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h108a5 5 0 0 0 5-5V15a5 5 0 0 0-5-5Z" stroke="var(--theme--primary)" stroke-opacity=".25" stroke-width="2"/><path d="M54 17h-6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2ZM98 17H62a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h36a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" fill="var(--theme--primary)" fill-opacity=".25"/><path opacity=".5" d="M38 18H28v1.27h10V18Zm-10 3.778h10v-1.27H28v1.27Z" fill="var(--theme--primary)"/><path d="M132 65H24a6 6 0 0 0-6 6v10a6 6 0 0 0 6 6h108a6 6 0 0 0 6-6V71a6 6 0 0 0-6-6Z" fill="var(--theme--background)"/><path d="M132 66H24a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h108a5 5 0 0 0 5-5V71a5 5 0 0 0-5-5Z" stroke="var(--theme--primary)" stroke-opacity=".25" stroke-width="2"/><path d="M104 73H48a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h56a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" fill="var(--theme--primary)" fill-opacity=".25"/><path opacity=".5" d="M38 74H28v1.27h10V74Zm-10 3.778h10v-1.27H28v1.27Z" fill="var(--theme--primary)"/><path d="M132 37H24a6 6 0 0 0-6 6v10a6 6 0 0 0 6 6h108a6 6 0 0 0 6-6V43a6 6 0 0 0-6-6Z" fill="var(--theme--background)"/><path d="M132 38H24a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h108a5 5 0 0 0 5-5V43a5 5 0 0 0-5-5Z" stroke="var(--theme--primary)" stroke-width="2"/><path d="M45.067 43h.866c.037 0 .067 1.492.067 3.333v3.334c0 1.84-.03 3.333-.067 3.333h-.866C45.03 53 45 51.508 45 49.667v-3.334c0-1.84.03-3.333.067-3.333Z" fill="var(--theme--primary)" fill-opacity=".5"/><path d="m123.758 51.292-.758-.759 3.033-3.033L123 44.467l.758-.759 3.034 3.034 3.033-3.034.758.759-3.033 3.033 3.033 3.033-.758.759-3.033-3.034-3.034 3.034Z" fill="var(--theme--primary)"/><path d="m123.758 23.583-.758-.758 3.033-3.033L123 16.758l.758-.758 3.034 3.033L129.825 16l.758.758-3.033 3.034 3.033 3.033-.758.758-3.033-3.033-3.034 3.033ZM123.758 79.583l-.758-.758 3.033-3.033L123 72.758l.758-.758 3.034 3.033L129.825 72l.758.758-3.033 3.034 3.033 3.033-.758.758-3.033-3.033-3.034 3.033Z" fill="var(--theme--primary)" fill-opacity=".5"/><path d="M38 46H28v1.27h10V46Zm-10 3.778h10v-1.27H28v1.27Z" fill="var(--theme--primary)"/></svg>
`,
});
