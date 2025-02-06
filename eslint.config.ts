import directusConfig from '@directus/eslint-config';

export default directusConfig({
	vue: true,
	eslintConfig: [{
		ignores: ['**/*.md', 'packages/**/shims.d.ts'],
	}, {
		files: ['**/*.vue'],
		rules: {
			'import/first': 'off',
		},
	}],
});
