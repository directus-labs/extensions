import { defineModule } from '@directus/extensions-sdk';
import { registerCommands } from './command-palette';
import { contentCommands } from './commands/content';
import { copyApiUrlCommands } from './commands/copy-api-url';
import { dataModelCommands } from './commands/data-model';
import { collectionItemFlowCommands, flowCommands } from './commands/flows';
import { searchCommands } from './commands/search';
import { usersCommands } from './commands/users';
import GlobalSearch from './global-search.vue';
import Settings from './settings.vue';
import { injectCommandPalette } from './utils/inject-command-palette';
import { injectSearchBar } from './utils/inject-search-bar';

registerCommands(
	searchCommands,
	collectionItemFlowCommands,
	copyApiUrlCommands,
	contentCommands,
	usersCommands,
	dataModelCommands,
	flowCommands,
);

export default defineModule({
	id: 'global-search',
	name: 'Command Palette',
	icon: 'search',
	routes: [
		{
			path: '',
			name: 'global-search-index',
			component: GlobalSearch,
		},
		{
			path: 'settings',
			name: 'global-search-settings',
			component: Settings,
		},
	],
	preRegisterCheck() {
		injectSearchBar();
		injectCommandPalette();

		return true;
	},
});
