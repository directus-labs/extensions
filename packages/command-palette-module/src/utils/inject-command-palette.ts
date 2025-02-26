import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { createApp, inject } from 'vue';
import { routeLocationKey, routerKey } from 'vue-router';
import CommandPaletteApp from '../command-palette/command-palette-app.vue';
import { getDirectusApp, getDirectusAppProvides } from './get-directus-app';

export function injectCommandPalette() {
	const app = createApp(CommandPaletteApp);
	const directusApp = getDirectusApp();

	// Register components from the Directus app
	for (const [name, component] of Object.entries(
		directusApp._context.components,
	)) {
		app.component(name, component as any);
	}

	// Register directives from the Directus app
	for (const [name, directive] of Object.entries(
		directusApp._context.directives,
	)) {
		app.directive(name, directive as any);
	}

	const injects = getDirectusAppProvides(directusApp);

	for (const key of [API_INJECT, STORES_INJECT]) {
		app.provide(key, injects[key]);
	}

	// Provide the router and route location to the command palette
	const vueI18nSymbol = directusApp.__VUE_I18N_SYMBOL__;

	directusApp.runWithContext(() => {
		app.provide(routeLocationKey, inject(routeLocationKey)!);
		app.provide(routerKey, inject(routerKey)!);
		app.provide(vueI18nSymbol, inject(vueI18nSymbol));
	});

	// @ts-ignore
	app.__VUE_I18N_SYMBOL__ = vueI18nSymbol;

	// Mount the app
	const container = document.createElement('div');
	container.id = 'global-search-command-palette';
	document.body.append(container);

	app.mount(container);
}
