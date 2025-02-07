export default {
	id: 'solarized',
	name: 'Solarized',
	appearance: 'light',
	rules: {
		background: '#fdf6e3',
		backgroundNormal: '#EDE8D7',
		backgroundAccent: '#d6d2c4',
		foreground: '#0E2A35',
		navigation: {
			modules: {
				background: '#0E2A35',
				button: {
					foreground: '#96A0A1',
					foregroundActive: 'var(--theme--navigation--modules--background)',
				},
			},
			project: {
				fontFamily: 'var(--theme--fonts--display--font-family)',
			},
		},
		foregroundAccent: '#5D6D74',
		foregroundSubdued: '#5D6D74',
		form: {
			field: {
				input: {
					borderColor: '#EDE8D7',
					borderColorHover: '#EDE8D7',
				},
				label: {
					fontFamily: 'var(--theme--fonts--serif--font-family)',
					fontWeight: '400',
				},
			},
		},
		primary: '#6D71BF',
		danger: '#CB4239',
		warning: '#AE8B2D',
		success: '#89992E',
		secondary: '#C24481',
		backgroundSubdued: '#FCF6E5',
		fonts: {
			display: {
				fontFamily: '"Abril Fatface", sans-serif',
				fontWeight: '400',
			},
			serif: {
				fontFamily: '"Playfair Display", serif',
			},
		},
		popover: {
			menu: {
				background: 'var(--theme--background-normal)',
			},
		},
		borderColorSubdued: '#d6d2c4',
		header: {
			headline: {
				fontFamily: 'var(--theme--fonts--serif--font-family)',
			},
		},
	},
};
