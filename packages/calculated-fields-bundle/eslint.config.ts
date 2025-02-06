import baseConfig from '../../eslint.config';

export default [
	...await baseConfig,
	{
		ignores: ['src/lib/parser/**'],
	},
];
