import directusConfig from '@directus/eslint-config';

export default directusConfig({
	vue: true,
	eslintConfig: [
		{
			ignores: ['**/*.md', '**/shims.d.ts', '**/shim.d.ts'],
		},
		{
			files: ['**/*.vue'],
			rules: {
				'import/first': 'off',
				'vue/valid-v-slot': 'warn',
			},
		},
	],
});
