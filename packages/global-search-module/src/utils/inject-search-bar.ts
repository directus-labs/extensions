import { App, createApp, nextTick } from "vue";
import SearchBar from "../components/search-bar.vue";
import { getDirectusRouter } from "./get-directus-router";

const ID = "global-search-bar";

let app: App | null = null;

export function injectSearchBar() {
  const router = getDirectusRouter();

  router.afterEach((to) => {
    if (to.name !== "global-search-index") {
      // Wait for DOM to be built and then inject search bar
      nextTick(inject);
    }
  });
}

function inject(retry: number = 0) {
  if (document.getElementById(ID)) return;

  const titleContainer = document.querySelector(".title-container");

  if (!titleContainer) {
    // This is needed for the initial page load, as things might be slow to set up
    if (retry < 3) {
      setTimeout(() => inject(retry + 1), 100);
    }

    return;
  }

  const searchBar = document.createElement("div");
  searchBar.id = ID;

  titleContainer!.appendChild(searchBar);

  if (app) {
    app.unmount();
  }

  app = createApp(SearchBar);
  app.mount(searchBar);
}
