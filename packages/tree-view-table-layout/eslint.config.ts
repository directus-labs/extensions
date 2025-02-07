import baseConfig from '../../eslint.config';

export default [
	...await baseConfig,
	{
		files: ['**/*.vue'],
		rules: {
			'vue/custom-event-name-casing': 'off',
		},
	},

	{
		ignores: ['**/shims.d.ts', '**/shim.d.ts'],
	},
];
