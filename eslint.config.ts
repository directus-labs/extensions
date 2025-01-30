import directusConfig from '@directus/eslint-config';

export default directusConfig({
	vue: true,
	eslintConfig: [{
		ignores: ['**/*.md'],
	}, {
		files: ['**/*.vue'],
		rules: {
			'import/first': 'off',
		},
	}],
});
