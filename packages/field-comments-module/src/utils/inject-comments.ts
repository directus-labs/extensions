import { API_INJECT, STORES_INJECT } from "@directus/constants";
import { createApp, inject } from "vue";
import { routeLocationKey, routerKey } from "vue-router";
import FieldCommentsApp from "../components/comments-drawer.vue";
import { getDirectusApp, getDirectusAppProvides } from "./get-directus-app";

export async function injectCommentsApp() {
  const ID = "field-comments-model";

  // If drawer missing from App
  if (!document.getElementById(ID)){
    const app = createApp(FieldCommentsApp, {});
    const directusApp = getDirectusApp();

    // Provide components
    for (const [name, component] of Object.entries(
      directusApp._context.components,
    )) {
      app.component(name, component as any);
    }
    // Provide directives
    for (const [name, directive] of Object.entries(
      directusApp._context.directives,
    )) {
      app.directive(name, directive as any);
    }

    // Provide Stores
    const injects = getDirectusAppProvides(directusApp);
    for (const key of [API_INJECT, STORES_INJECT]) {
      app.provide(key, injects[key]);
    }

    // Provide routes and i18n
    const vueI18nSymbol = directusApp.__VUE_I18N_SYMBOL__;
    directusApp.runWithContext(() => {
      app.provide(routeLocationKey, inject(routeLocationKey)!);
      app.provide(routerKey, inject(routerKey)!);
      app.provide(vueI18nSymbol, inject(vueI18nSymbol));
    });

    // @ts-ignore
    app.__VUE_I18N_SYMBOL__ = vueI18nSymbol;

    // Mount the app
    const container = document.createElement("div");
    container.id = ID;
    document.body.appendChild(container);

    app.mount(container);
  }
}