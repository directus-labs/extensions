import { API_INJECT, SDK_INJECT, STORES_INJECT } from '@directus/constants';
import { Component, createApp, Directive, inject } from 'vue';
import { routeLocationKey, routerKey } from 'vue-router';
import { getDirectusApp, getDirectusAppProvides } from '../../interface/utils/get-directus-app';
import RealtimeCollaborationApp from '../components/realtime-collaboration-app.vue';

export function injectRealtimeApp() {
	const app = createApp(RealtimeCollaborationApp);
	const directusApp = getDirectusApp();

	// Register components from the Directus app
	for (const [name, component] of Object.entries(directusApp._context.components)) {
		app.component(name, component as Component);
	}

	// Register directives from the Directus app
	for (const [name, directive] of Object.entries(directusApp._context.directives)) {
		app.directive(name, directive as Directive);
	}

	const injects = getDirectusAppProvides(directusApp);

	for (const key of [API_INJECT, STORES_INJECT, SDK_INJECT]) {
		app.provide(key, injects[key]);
	}

	if ('__VUE_I18N_SYMBOL__' in directusApp) {
		// Provide the router and route location to the command palette
		const vueI18nSymbol = directusApp.__VUE_I18N_SYMBOL__;

		directusApp.runWithContext(() => {
			app.provide(routeLocationKey, inject(routeLocationKey)!);
			app.provide(routerKey, inject(routerKey)!);
			app.provide(vueI18nSymbol, inject(vueI18nSymbol));
		});

		if ('__VUE_I18N_SYMBOL__' in app) {
			app.__VUE_I18N_SYMBOL__ = vueI18nSymbol;
		}
	}

	// Mount the app
	const container = document.createElement('div');
	container.id = 'collab-controller';
	document.body.append(container);

	app.mount(container);
}
