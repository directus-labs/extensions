import baseConfig from '../../eslint.config.mjs';

export default [
	...baseConfig,
	{
		ignores: ['src/lib/parser/**'],
	},
];
