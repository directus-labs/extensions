import baseConfig from '../../eslint.config.mjs';

export default [
	...baseConfig,
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
