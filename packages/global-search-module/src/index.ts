import { defineModule } from "@directus/extensions-sdk";
import { registerCommands } from "./command-palette";
import { contentCommands } from "./commands/content";
import { dataModelCommands } from "./commands/data-model";
import { collectionItemFlowCommands, flowCommands } from "./commands/flows";
import { dynamicSearchCommands, searchCommands } from "./commands/search";
import { usersCommands } from "./commands/users";
import ModuleComponent from "./module.vue";
import Settings from "./settings.vue";
import { injectCommandPalette } from "./utils/inject-command-palette";
import { injectSearchBar } from "./utils/inject-search-bar";

registerCommands(
  searchCommands,
  dynamicSearchCommands,
  collectionItemFlowCommands,
  contentCommands,
  usersCommands,
  dataModelCommands,
  flowCommands,
);

export default defineModule({
  id: "global-search",
  name: "Global Search",
  icon: "search",
  routes: [
    {
      path: "",
      name: "global-search-index",
      component: ModuleComponent,
    },
    {
      path: "settings",
      name: "global-search-settings",
      component: Settings,
    },
  ],
  preRegisterCheck() {
    // TODO only inject if module is actually enabled in project settings
    injectSearchBar();
    injectCommandPalette();
    return true;
  },
});
