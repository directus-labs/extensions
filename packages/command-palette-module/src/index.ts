import { defineModule } from '@directus/extensions-sdk';
import { registerCommands } from './command-palette';
import { contentCommands } from './commands/content';
import { copyApiUrlCommands } from './commands/copy-api-url';
import { dataModelCommands } from './commands/data-model';
import { deploymentsCommands } from './commands/deployments';
import { filesCommands } from './commands/files';
import { collectionItemFlowCommands, flowCommands } from './commands/flows';
import { insightsCommands } from './commands/insights';
import { searchCommands } from './commands/search';
import { settingsCommands } from './commands/settings';
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
	filesCommands,
	insightsCommands,
	dataModelCommands,
	settingsCommands,
	deploymentsCommands,
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
