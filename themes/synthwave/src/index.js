export default {
	id: 'synthwave',
	name: 'Synthwave',
	appearance: 'dark',
	rules: {
		"background": "#262335",
		"navigation": {
			"background": "#241b2f",
			"modules": {
				"background": "color-mix(in srgb, #241b2f, #000000 20%)",
				"button": {
					"foreground": "var(--theme--primary-subdued)",
					"backgroundActive": "var(--theme--primary-subdued)"
				}
			},
			"project": {
				"background": "#241b2f"
			},
			"list": {
				"divider": {
					"borderColor": "var(--theme--secondary-subdued)"
				},
				"fontFamily": "var(--theme--fonts--monospace--font-family)",
				"backgroundHover": "var(--theme--background-subdued)",
				"foreground": "#ffffff",
				"backgroundActive": "#34294f66",
				"icon": {
					"foreground": "#ff8b39"
				}
			}
		},
		"backgroundSubdued": "#ffffff20",
		"foreground": "#ffffff",
		"primary": "#ff7edb",
		"danger": "#fe4450",
		"success": "#72f1b8",
		"warning": "#fede5d",
		"secondary": "#36f9f6",
		"borderRadius": "12px",
		"sidebar": {
			"background": "#241b2f",
			"section": {
				"toggle": {
					"backgroundHover": "#ffffff20",
					"backgroundActive": "var(--theme--primary-subdued)",
					"background": "transparent"
				}
			}
		},
		"fonts": {
			"monospace": {
				"fontFamily": "\"Fira Code\", monospace"
			}
		},
		"header": {
			"title": {
				"fontFamily": "var(--theme--fonts--monospace--font-family)"
			}
		},
		"form": {
			"field": {
				"input": {
					"borderColor": "var(--theme--background-subdued)",
					"backgroundSubdued": "#272335"
				}
			}
		},
		"backgroundNormal": "#241b2f"
	}
};
