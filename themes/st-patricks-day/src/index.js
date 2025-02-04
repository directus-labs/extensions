export default {
	id: 'directus-labs-st-patricks-day',
	name: 'St Patrick\'s Day',
	appearance: 'light',
	rules: {
		primary: '#009a49',
		navigation: {
			modules: {
				background: 'var(--theme--primary)',
				button: {
					foreground: 'white',
					foregroundActive: 'var(--theme--primary)',
				},
			},
			project: {
				background: '#ff7900',
				foreground: 'white',
			},
			list: {
				backgroundHover: 'var(--theme--navigation--project--background)',
				backgroundActive: 'var(--theme--navigation--list--background-hover)',
				foregroundHover: 'white',
				foregroundActive: 'var(--theme--navigation--list--foreground-hover)',
				icon: {
					foregroundActive: 'white',
					foregroundHover: 'white',
				},
			},
		},
		fonts: {
			display: {
				fontFamily: '"Irish Grover", sans-serif',
				fontWeight: '400',
			},
			sans: {
				fontFamily: '"Patrick Hand", sans-serif',
				fontWeight: '400',
			},
		},
		sidebar: {
			background: '#ffd700',
			foreground: 'var(--theme--foreground)',
			section: {
				toggle: {
					background: 'color-mix(in srgb, black, var(--theme--sidebar--background) 90%)',
				},
			},
		},
		borderRadius: '16px',
	},
};
