export default {
	id: 'dark-terminal',
	name: 'Dark Terminal',
	appearance: 'dark',
	rules: {
		"foreground": "#00ff00",
		"borderRadius": "0",
		"borderWidth": "3px",
		"foregroundAccent": "var(--theme--foreground)",
		"foregroundSubdued": "var(--theme--foreground)",
		"primary": "var(--theme--foreground)",
		"fonts": {
			"display": {
				"fontFamily": "\"IBM Plex Mono\", monospace"
			},
			"sans": {
				"fontFamily": "\"IBM Plex Mono\", monospace"
			}
		},
		"navigation": {
			"modules": {
				"background": "black"
			}
		},
		"background": "black",
		"header": {
			"background": "var(--theme--navigation--project--background)"
		}
	}
};
