import { defineInterface } from '@directus/extensions-sdk';
import { DeepPartial, Field } from '@directus/types';
import { Source } from './types';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: 'directus-labs-multilevel-autocomplete-api-interface',
	name: 'Multilevel Autocomplete',
	description: 'Get data from nested API queries',
	icon: 'find_in_page',
	component: InterfaceComponent,
	types: ['json'],
	options: () => {
		const stepFields: DeepPartial<Field>[] = [
			{
				field: 'source',
				name: 'Source',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: 'Web Request', value: Source.request },
							{ text: 'List', value: Source.list },
						],
					},
				},
				schema: {
					default_value: Source.request,
				},
			},
			{
				field: 'requestMethod',
				name: 'Method',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: 'GET', value: 'GET' },
							{ text: 'POST', value: 'POST' },
						],
						allowOther: true,
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
				schema: {
					default_value: 'GET',
				},
			},
			{
				field: 'requestUrl',
				name: 'URL',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: 'https://restcountries.com/v3.1/region/{{values[0]}}',
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
			},
			{
				field: 'requestHeaders',
				name: 'Headers',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						fields: [
							{
								field: 'header',
								name: 'Header',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'input',
									required: true,
									options: {
										placeholder: 'Content-Type',
									},
								},
							},
							{
								field: 'value',
								name: 'Value',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'input',
									required: true,
									options: {
										placeholder: 'application/json',
									},
								},
							},
						],
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
			},
			{
				field: 'requestBody',
				name: 'Body',
				type: 'text',
				meta: {
					width: 'full',
					interface: 'input-multiline',
					options: {
						font: 'monospace',
						placeholder: '$t:any_string_or_json',
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
			},
			{
				field: 'requestTrigger',
				name: 'Trigger',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: 'Throttle',
								value: 'throttle',
							},
							{
								text: 'Debounce',
								value: 'debounce',
							},
						],
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
				schema: {
					default_value: 'throttle',
				},
			},
			{
				field: 'requestRate',
				name: 'Rate',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.request,
								},
							},
							hidden: true,
						},
					],
				},
				schema: {
					default_value: 500,
				},
			},
			{
				field: 'list',
				name: 'List',
				type: 'json',
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
									width: 'full',
									interface: 'input',
									required: true,
								},
							},
							{
								field: 'value',
								name: 'Value',
								type: 'json',
								meta: {
									width: 'full',
									interface: 'input-multiline',
									required: true,
									options: {
										font: 'monospace',
										placeholder: '$t:any_string_or_json',
									},
								},
							},
						],
					},
					conditions: [
						{
							rule: {
								source: {
									_neq: Source.list,
								},
							},
							hidden: true,
						},
					],
				},
			},
			{
				field: 'resultsPath',
				name: 'Results Path',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'input',
					options: {
						'placeholder': 'result.predictions',
						'font': 'monospace',
					},
				},
			},
			{
				field: 'textPath',
				name: 'Text Path',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						'placeholder': 'structured_main_text',
						'font': 'monospace',
					},
				},
			},
			{
				field: 'valuePath',
				name: 'Value Path',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						'placeholder': 'structured_main_value',
						'font': 'monospace',
					},
				},
			},
			{
				field: 'placeholder',
				name: '$t:placeholder',
				meta: {
					width: 'half',
					interface: 'system-input-translated-string',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
				},
			},
			{
				field: 'font',
				name: '$t:font',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
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
		];

		return [
			...stepFields,
			{
				field: 'nestedSteps',
				name: 'Nested Steps',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						template: "{{ source }}",
						fields: stepFields,
					},
				},
			},
			{
				field: 'payload',
				name: 'Payload',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'input-code',
					options: {
						language: 'json',
						placeholder: JSON.stringify({
							"region": "{{ values[0] }}",
							"country": {
								"name": "{{ steps[1].text }}",
								"code": "{{ steps[1].value.cca2 }}",
							},
						}, null, 2),
						template: JSON.stringify({
							"region": "{{ values[0] }}",
							"country": {
								"name": "{{ steps[1].text }}",
								"code": "{{ steps[1].value.cca2 }}",
							},
						}, null, 2),
					},
				},
			},
		];
	},
});
