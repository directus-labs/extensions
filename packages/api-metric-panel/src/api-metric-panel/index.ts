import { definePanel } from '@directus/extensions-sdk';
import PanelApiMetric from './panel.vue';


export default definePanel({
	id: 'api-metric-panel',
	name: 'API Metric Panel',
	description: 'A panel which allows to display a metric value from an external API!',
	icon: 'functions',
	component: PanelApiMetric,
	options: ({ options }) => {

		const fieldIsNumber = true; 


		return [
			{
				field: 'styleDivider',
				type: 'alias',
				meta: {
					interface: 'presentation-divider',
					options: {
						icon: 'style',
						title: 'Style & Format',
					},
					special: ['alias', 'no-data'],
				},
			},
			{
				field: 'prefix',
				type: 'string',
				name: '$t:prefix',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:prefix_placeholder',
						trim: false,
					},
				},
			},
			{
				field: 'suffix',
				type: 'string',
				name: '$t:suffix',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:suffix_placeholder',
						trim: false,
					},
				},
			},
			{
				field: 'numberStyle',
				type: 'string',
				name: '$t:style',
				schema: {
					default_value: 'decimal',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:decimal',
								value: 'decimal',
							},
							{
								text: '$t:currency',
								value: 'currency',
							},
							{
								text: '$t:percent',
								value: 'percent',
							},
							{
								text: '$t:unit',
								value: 'unit',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'notation',
				type: 'string',
				name: '$t:notation',
				schema: {
					default_value: 'standard',
				},
				meta: {
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:standard',
								value: 'standard',
							},
							{
								text: '$t:scientific',
								value: 'scientific',
							},
							{
								text: '$t:engineering',
								value: 'engineering',
							},
							{
								text: '$t:compact',
								value: 'compact',
							},
						],
					},
					width: 'half',
				},
			},
			{
				field: 'unit',
				type: 'string',
				name: '$t:unit',
				schema: {
					default_value: '',
				},
				meta: {
					interface: 'input',
					hidden: options?.numberStyle !== 'unit' && options?.numberStyle !== 'currency',
				},
			},
			{
				field: 'minimumFractionDigits',
				type: 'integer',
				name: '$t:minimum_fraction_digits',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:decimals_placeholder',
					},
				},
				schema: {
					default_value: 0,
				},
			},
			{
				field: 'maximumFractionDigits',
				type: 'integer',
				name: '$t:maximum_fraction_digits',
				meta: {
					interface: 'input',
					width: 'half',
					options: {
						placeholder: '$t:decimals_placeholder',
					},
				},
				schema: {
					default_value: 0,
				},
			},
			{
				field: 'conditionalFormatting',
				type: 'json',
				name: '$t:conditional_styles',
				meta: {
					interface: 'list',
					width: 'full',
					options: {
						template: '{{color}} {{operator}} {{value}}',
						fields: [
							{
								field: 'operator',
								name: '$t:operator',
								type: 'string',
								schema: {
									default_value: '>=',
								},
								meta: {
									interface: 'select-dropdown',
									options: {
										choices: [
											{
												text: '$t:operators.eq',
												value: '=',
											},
											{
												text: '$t:operators.neq',
												value: '!=',
											},
											{
												text: '$t:operators.gt',
												value: '>',
												disabled: !fieldIsNumber,
											},
											{
												text: '$t:operators.gte',
												value: '>=',
												disabled: !fieldIsNumber,
											},
											{
												text: '$t:operators.lt',
												value: '<',
												disabled: !fieldIsNumber,
											},
											{
												text: '$t:operators.lte',
												value: '<=',
												disabled: !fieldIsNumber,
											},
										],
									},
									width: 'half',
								},
							},
							{
								field: 'value',
								name: '$t:value',
								type: 'string',
								schema: {
									default_value: 0,
								},
								meta: {
									interface: 'input',
									width: 'half',
								},
							},
							{
								field: 'color',
								name: '$t:color',
								type: 'string',
								meta: {
									interface: 'select-color',
									display: 'color',
								},
							},
						],
					},
				},
			},
			{
				field: 'textAlign',
				type: 'string',
				name: '$t:text_align',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:left',
								value: 'left',
							},
							{
								text: '$t:center',
								value: 'center',
							},
							{
								text: '$t:right',
								value: 'right',
							},
							{
								text: '$t:justify',
								value: 'justify',
							},
						],
					},
				},
				schema: {
					default_value: 'center',
				},
			},
			{
				field: 'fontWeight',
				type: 'string',
				name: '$t:font_weight',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:fonts.thin',
								value: 100,
							},
							{
								text: '$t:fonts.extra_light',
								value: 200,
							},
							{
								text: '$t:fonts.light',
								value: 300,
							},
							{
								text: '$t:fonts.normal',
								value: 400,
							},
							{
								text: '$t:fonts.medium',
								value: 500,
							},
							{
								text: '$t:fonts.semi_bold',
								value: 600,
							},
							{
								text: '$t:fonts.bold',
								value: 700,
							},
							{
								text: '$t:fonts.extra_bold',
								value: 800,
							},
							{
								text: '$t:fonts.black',
								value: 900,
							},
						],
					},
				},
				schema: {
					default_value: 800,
				},
			},
			{
				field: 'fontStyle',
				type: 'string',
				name: '$t:font_style',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{
								text: '$t:fonts.normal',
								value: 'normal',
							},
							{
								text: '$t:fonts.italic',
								value: 'italic',
							},
							{
								text: '$t:fonts.oblique',
								value: 'oblique',
							},
						],
					},
				},
				schema: {
					default_value: 'normal',
				},
			},
			{
				field: 'fontSize',
				type: 'string',
				name: '$t:font_size',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:fonts.small', value: '32px' },
							{ text: '$t:fonts.medium', value: '48px' },
							{ text: '$t:fonts.large', value: '64px' },
							{ text: '$t:fonts.auto', value: 'auto' },
						],
					},
				},
				schema: {
					default_value: 'auto',
				},
			},
			{
				field: 'font',
				type: 'string',
				name: '$t:font',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:displays.formatted-value.font_sans_serif', value: 'sans-serif' },
							{ text: '$t:displays.formatted-value.font_serif', value: 'serif' },
							{ text: '$t:displays.formatted-value.font_monospace', value: 'monospace' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
		];
	},
	minWidth: 12,
	minHeight: 8,
});
