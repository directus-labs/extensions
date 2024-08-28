export default {
	id: 'tmnt',
	name: 'Adolescent Mutant Ninja Tortoises',
	appearance: 'dark',
	rules: {
		"background": "#073606",
		"navigation": {
			"modules": {
				"button": {
					"backgroundActive": "var(--theme--background)",
					"foreground": "#ffffff70"
				},
				"background": "var(--project-color)",
				"borderWidth": "2px",
				"borderColor": "var(--theme--background)"
			},
			"list": {
				"divider": {
					"borderColor": "#90C94070"
				},
				"backgroundHover": "var(--theme--background-subdued)",
				"foreground": "#ffffff",
				"icon": {
					"foreground": "#F1BB32"
				},
				"backgroundActive": "color-mix(in srgb, var(--theme--background), #000000 20%)"
			},
			"background": "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%23FFFFFF50' fill-opacity='0.10' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\");",
			"borderColor": "color-mix(in srgb, var(--theme--background), #ffffff 10%)",
			"borderWidth": "2px",
			"project": {
				"background": "transparent"
			}
		},
		"foreground": "#ffffff",
		"danger": "#fe4450",
		"success": "#72f1b8",
		"warning": "#fede5d",
		"secondary": "#4C9C23",
		"borderRadius": "0px",
		"sidebar": {
			"background": "color-mix(in srgb, var(--theme--background), #000000 10%)",
			"section": {
				"toggle": {
					"backgroundHover": "#ffffff20",
					"backgroundActive": "var(--theme--primary-subdued)",
					"background": "transparent"
				}
			},
			"borderWidth": "2px",
			"borderColor": "color-mix(in srgb, var(--theme--background), #000000 25%)"
		},
		"fonts": {
			"monospace": {
				"fontFamily": "\"Fira Code\", monospace"
			},
			"sans": {
				"fontFamily": "\"Noto Sans\", sans-serif"
			}
		},
		"header": {
			"title": {
				"fontFamily": "\"Press Start 2P\", system-ui",
				"fontWeight": 400
			},
			"headline": {
				"foreground": "var(--theme--primary)"
			}
		},
		"primary": "#F4B838",
		"borderColor": "#90C940",
		"borderColorAccent": "#ffffff30",
		"borderColorSubdued": "#ffffff10",
		"backgroundNormal": "#063105",
		"form": {
			"field": {
				"input": {
					"borderColor": "var(--theme--background-subdued)",
					"borderColorHover": "#F4B83880",
					"height": "56px"
				}
			}
		},
		"foregroundSubdued": "#ffffff80",
		"backgroundAccent": "color-mix(in srgb, var(--theme--background), #ffffff 20%)",
		"backgroundSubdued": "color-mix(in srgb, var(--theme--background), #ffffff 10%)"
	}
};
