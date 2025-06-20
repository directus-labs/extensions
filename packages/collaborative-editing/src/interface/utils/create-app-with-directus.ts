import type { Component } from 'vue';
import { SDK_INJECT, STORES_INJECT } from '@directus/constants';
import { createApp, inject } from 'vue';
import { routeLocationKey, routerKey } from 'vue-router';
import { getDirectusApp, getDirectusAppRootComponent } from './get-directus-app';

export function createAppWithDirectus(rootComponent: Component, rootProps?: Record<string, unknown> | null) {
	const directusApp = getDirectusApp();
	const app = createApp(rootComponent, rootProps);

	// Register components from the Directus app
	for (const [name, component] of Object.entries(directusApp._context.components)) {
		app.component(name, component as any);
	}

	// Register directives from the Directus app
	for (const [name, directive] of Object.entries(directusApp._context.directives)) {
		app.directive(name, directive as any);
	}

	const provides = getDirectusAppRootComponent().provides;
	app.provide(STORES_INJECT, provides[STORES_INJECT]);
	app.provide(SDK_INJECT, provides[SDK_INJECT]);

	// Provide the router and route location to the command palette
	directusApp.runWithContext(() => {
		app.provide(routeLocationKey, inject(routeLocationKey)!);
		app.provide(routerKey, inject(routerKey)!);
	});

	return app;
}
