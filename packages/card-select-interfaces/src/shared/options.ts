/**
 * Common shared options for the Radio Cards and Checkbox Cards interfaces
 * @returns {Array} - Array of options
 */
export const options  = [
	{
		field: 'choices',
		type: 'json',
		name: 'Choices',
		meta: {
			width: 'full',
			interface: 'list',
			options: {
				template: '{{ text }}',
				fields: [
					{
						field: 'text',
						type: 'string',
						name: 'Text',
						meta: {
							width: 'half',
							note: 'Label to show in the studio interface.',
							interface: 'input',
						},
					},
					{
						field: 'value',
						type: 'string',
						name: 'Value',
						meta: {
							width: 'half',
							interface: 'input',
							note: 'Value to be stored in the database.',
							options: {
								font: 'monospace',
							},
						},
					},
					{
						field: 'description',
						type: 'string',
						name: 'Description',
						meta: {
							width: 'full',
							note: 'Add an optional description to display below the text label for additional context.',
							interface: 'input-multiline',
						},
					},
					{
						field: 'icon_type',
						type: 'string',
						name: 'Icon Type',
						meta: {
							width: 'full',
							interface: 'select-radio',
							options: {
								choices: [
									{ text: 'Icon', value: 'icon' },
									{ text: 'Image', value: 'image' },
									{ text: 'SVG Icon', value: 'svg' },
								],
							},
						},
						schema: {
							default_value: 'svg',
						},
					},
					{
						field: 'svg_icon',
						type: 'text',
						name: 'SVG Icon',
						meta: {
							width: 'full',
							interface: 'input-code',
							options: {
								language: 'svg',
							},
							hidden: true,

							conditions: [
								{
									hidden: false,
									rule: {
										_and: [{ icon_type: { _eq: 'svg' } }],
									},
								},
							],
						},
					},
					{
						field: 'image',
						name: 'Image',
						type: 'uuid',
						special: 'file',
						meta: {
							width: 'full',
							interface: 'image-uuid',
							relational: true,
							hidden: true,
							conditions: [
								{
									hidden: false,
									rule: {
										_and: [{ icon_type: { _eq: 'image' } }],
									},
								},
							],

						},
					},
					{
						field: 'icon',
						name: 'Icon',
						type: 'string',
						meta: {
							width: 'full',
							interface: 'select-icon',
							hidden: true,
							conditions: [
								{
									hidden: false,
									rule: {
										_and: [{ icon_type: { _eq: 'icon' } }],
									},
								},
							],
						},
					},
				],
			},
		},
	},
	{
		field: 'enableSearch',
		type: 'boolean',
		name: 'Enable Search',
		meta: {
			width: 'half',
			interface: 'boolean',
		},
		schema: {
			default_value: false,
		},
	},
	{
		field: 'gridSize',
		type: 'integer',
		name: 'Grid Size',
		meta: {
			width: 'half',
			interface: 'select-dropdown',
			options: {
				choices: [
					{ text: '2 Columns', value: 2 },
					{ text: '3 Columns', value: 3 },
					{ text: '4 Columns', value: 4 },
					{ text: '5 Columns', value: 5 },
					{ text: '6 Columns', value: 6 },
				],
			},
		},
		schema: {
			default_value: 4,
		},
	},
]
