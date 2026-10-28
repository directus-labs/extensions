import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { createApp, inject } from 'vue';
import { routeLocationKey, routerKey } from 'vue-router';
import CommandPaletteApp from '../command-palette/command-palette-app.vue';
import { getDirectusApp, getDirectusAppProvides } from './get-directus-app';

const ID = 'global-search-command-palette';

export function injectCommandPalette() {
	if (document.querySelector(`#${ID}`)) return;

	const app = createApp(CommandPaletteApp);
	const directusApp = getDirectusApp();

	for (const [name, component] of Object.entries(
		directusApp._context.components,
	)) {
		app.component(name, component as any);
	}

	for (const [name, directive] of Object.entries(
		directusApp._context.directives,
	)) {
		app.directive(name, directive as any);
	}

	const injects = getDirectusAppProvides(directusApp);

	for (const key of [API_INJECT, STORES_INJECT]) {
		app.provide(key, injects[key]);
	}

	const vueI18nSymbol = directusApp.__VUE_I18N_SYMBOL__;

	directusApp.runWithContext(() => {
		app.provide(routeLocationKey, inject(routeLocationKey)!);
		app.provide(routerKey, inject(routerKey)!);
		app.provide(vueI18nSymbol, inject(vueI18nSymbol));
	});

	// @ts-expect-error Vue I18n stores its injection symbol on the app instance
	app.__VUE_I18N_SYMBOL__ = vueI18nSymbol;

	const container = document.createElement('div');
	container.id = ID;
	document.body.append(container);

	try {
		app.mount(container);
	}
	catch (error) {
		container.remove();
		throw error;
	}
}
