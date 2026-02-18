import { defineInterface, useStores } from '@directus/extensions-sdk';
import defaults from './defaults';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-tour-group-interface',
	name: 'Tour',
	icon: 'subscriptions',
	description: 'Create an interactive tour for your form.',
	component: InterfaceComponent,
	localTypes: ['group'],
	group: 'group',
	types: ['alias'],
	options({ collection, field }) {
		const { useFieldsStore } = useStores();
		const fieldsStore = useFieldsStore();
		const classes: string[] = [];
		findClassnames(field.field);

		return {
			standard: [
				{
					field: 'steps',
					name: 'Tour Steps',
					meta: {
						width: 'full',
						interface: 'list',
						options: {
							addLabel: 'Add Step',
							template: '{{ title }} · {{ description }}',
							fields: [
								{
									field: 'element',
									type: 'string',
									name: 'Element (Selector)',
									meta: {
										interface: 'input',
										width: 'half',
										options: {
											placeholder: '.tour-field-title',
										},
									},
									schema: {
										default_value: '',
									},
								},
								// Popover
								{
									// TODO: fields dont work: no way to change value after saved … why?
									field: 'title',
									type: 'string',
									name: '$t:title',
									meta: {
										interface: 'system-input-translated-string',
										width: 'half',
									},
									schema: {
										default_value: '',
									},
								},
								{
									field: 'description',
									type: 'string',
									name: '$t:description',
									meta: {
										interface: 'system-input-translated-string',
										width: 'full',
									},
									schema: {
										default_value: '',
									},
								},
								{
									field: 'side',
									name: 'Position Side',
									type: 'string',
									meta: {
										interface: 'select-dropdown',
										width: 'half',
										options: {
											choices: [
												{
													text: '$t:top',
													value: 'top',
												},
												{
													text: '$t:right',
													value: 'right',
												},
												{
													text: '$t:bottom',
													value: 'bottom',
												},
												{
													text: '$t:left',
													value: 'left',
												},
												{ text: 'Over', value: 'over' },
											],
										},
									},
									schema: {
										default_value: 'bottom',
									},
								},
								{
									field: 'align',
									name: 'Position Alignment',
									type: 'string',
									meta: {
										interface: 'select-dropdown',
										width: 'half',
										options: {
											choices: [
												{
													text: '$t:start',
													value: 'start',
												},
												{
													text: '$t:center',
													value: 'center',
												},
												{ text: 'End', value: 'end' },
											],
										},
									},
									schema: {
										default_value: 'start',
									},
								},
								{
									field: 'forceClick',
									name: 'Force Click',
									type: 'boolean',
									meta: {
										width: 'half',
										interface: 'boolean',
										options: {
											label: 'Force the user to click the element',
										},
									},
									schema: {
										default_value: false,
									},
								},
								{
									field: 'preventBack',
									name: 'Prevent Back Navigation',
									type: 'boolean',
									meta: {
										width: 'half',
										interface: 'boolean',
										options: {
											label: 'Prevent the user from navigating back',
										},
									},
									schema: {
										default_value: false,
									},
								},

								{
									field: 'notice',
									type: 'alias',
									meta: {
										interface: 'presentation-notice',
										options: {
											color: 'normal',
											text: `<strong>The group tries to create these classes for its fields:</strong><br>${
												classes?.length
													? classes.join('<br>')
													: 'No fields in this group.'
											}`,
										},
									},
								},
							],
						},
					},
					schema: {
						default_value: null,
					},
				},
			],
			advanced: [
				{
					field: 'buttonIcon',
					name: 'Button Icon',
					meta: {
						width: 'half',
						interface: 'select-icon',
					},
					schema: {
						default_value: defaults.buttonIcon,
					},
				},
				{
					field: 'buttonTooltip',
					name: 'Button Label',
					meta: {
						width: 'half',
						interface: 'system-input-translated-string',
						options: {
							placeholder: defaults.buttonTooltip,
						},
					},
					schema: {
						default_value: null,
					},
				},
				{
					field: 'exitMessage',
					name: 'Exit Message',
					meta: {
						width: 'full',
						interface: 'system-input-translated-string',
						options: {
							placeholder: defaults.exitMessage,
						},
					},
					schema: {
						default_value: null,
					},
				},
				{
					field: 'rootSelector',
					name: 'Root selector',
					type: 'string',
					meta: {
						width: 'full',
					},
					schema: {
						default_value: defaults.rootSelector,
					},
				},
			],
		};

		function findClassnames(group: string = '') {
			if (!group)
				return;

			const children = fieldsStore.getFieldGroupChildren(collection, group);

			children?.forEach((childField: any) => {
				const isGroup = childField.meta?.special?.includes('group');

				classes.push(
					`${childField.name}: ${
						!isGroup ? `<code>.tour-field-${childField.field}</code>, ` : ''
					}<code>.tour-input-${childField.field}</code>`,
				);

				if (isGroup) {
					findClassnames(childField.field);
				}
			});
		}
	},
});
