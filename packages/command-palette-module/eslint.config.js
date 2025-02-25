import baseConfig from '../../eslint.config.mjs';

export default [
	...baseConfig,
	{
		rules: {
			'@typescript-eslint/ban-ts-comment': 'off',
			'no-nested-ternary': 'off',
		},
	},
];
