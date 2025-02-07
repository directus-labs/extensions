import baseConfig from '../../eslint.config';

export default [
	...await baseConfig,
	{
		rules: {
			'ts/ban-ts-comment': 'off',
		},
	},
];
