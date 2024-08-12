export default {
	id: 'aubergine',
	name: 'Aubergine',
	appearance: 'light',
	rules: {
		"navigation": {
			"modules": {
				"background": "var(--theme--primary)",
				"button": {
					"backgroundActive": "var(--theme--primary-accent)",
					"foregroundActive": "var(--theme--navigation--modules--button--foreground)",
					"foreground": "white"
				}
			},
			"background": "var(--theme--primary)",
			"project": {
				"background": "transparent",
				"foreground": "white"
			},
			"list": {
				"foreground": "white",
				"icon": {
					"foreground": "white"
				},
				"backgroundActive": "var(--theme--primary-accent)",
				"backgroundHover": "var(--theme--primary-accent)",
				"divider": {
					"borderColor": "var(--theme--primary-accent)"
				}
			}
		},
		"primary": "#522553",
		"primaryAccent": "color-mix(in srgb, var(--theme--primary), black 50%)",
		"foregroundSubdued": "color-mix(in srgb, var(--theme--primary), white 50%)",
		"foreground": "black",
		"form": {
			"field": {
				"label": {
					"foreground": "var(--theme--foreground)"
				}
			}
		},
		"foregroundAccent": "color-mix(in srgb, var(--theme--primary), white 10%)",
		"backgroundNormal": "transparent",
		"sidebar": {
			"background": "var(--theme--background-accent)"
		},
		"header": {
			"headline": {
				"foreground": "var(--theme--foreground)"
			},
			"title": {
				"foreground": "var(--theme--foreground)"
			}
		}
	}
};
