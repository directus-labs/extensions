import directusConfig from '@directus/eslint-config';

export default [
	...directusConfig,
	{
		ignores: ['**/*.md', '**/shims.d.ts', '**/shim.d.ts', 'archived/**'],
	},
	{
		rules: {
			// Temporary disabled, will be resolved step by step
			'unicorn/no-array-callback-reference': 'off',
			'unicorn/no-await-expression-member': 'off',
			'unicorn/consistent-function-scoping': 'off',
			'unicorn/no-array-for-each': 'off',
			'unicorn/prefer-spread': 'off',
			'unicorn/prefer-module': 'off',
		},
	},
	{
		files: ['**/*.vue'],
		rules: {
			'vue/valid-v-slot': 'warn',
		},
	},
];
