import { createApp, inject } from 'vue';
import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { routeLocationKey, routerKey } from 'vue-router';
import CommandPaletteApp from '../components/command-palette/command-palette-app.vue';
import { getDirectusApp } from './get-directus-app';

export function injectCommandPalette() {
  const el = document.createElement('div');
  el.id = 'global-search-command-palette';
  document.body.appendChild(el);

  const app = createApp(CommandPaletteApp);
  const directusApp = getDirectusApp();

  // Register components from the Directus app
  for (const [name, component] of Object.entries(directusApp._context.components)) {
    app.component(name, component as any);
  }

  // Dirtily hack in the API and stores injects
  const injects = directusApp._container._vnode.component.provides;
  for (const key of [API_INJECT, STORES_INJECT]) {
    app.provide(key, injects[key])
  }

  // Provide the router and route location to the command palette
  directusApp.runWithContext(() => {
    app.provide(routeLocationKey, inject(routeLocationKey));
    app.provide(routerKey, inject(routerKey));
  })

  app.mount('#global-search-command-palette');
}
