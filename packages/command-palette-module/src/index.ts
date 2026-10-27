import { API_INJECT, STORES_INJECT } from '@directus/constants';
import { defineModule } from '@directus/extensions-sdk';
import { registerCommands } from './command-palette';
import { accountCommands } from './commands/account';
import { bookmarkCommands } from './commands/bookmarks';
import { contentCommands } from './commands/content';
import { copyApiUrlCommands } from './commands/copy-api-url';
import { dataModelCommands } from './commands/data-model';
import { deploymentsCommands } from './commands/deployments';
import { filesCommands } from './commands/files';
import { collectionItemFlowCommands, flowCommands } from './commands/flows';
import { insightsCommands } from './commands/insights';
import { previewCommands } from './commands/preview';
import { searchCommands } from './commands/search';
import { settingsCommands } from './commands/settings';
import { usersCommands } from './commands/users';
import { versionCommands } from './commands/versions';
import GlobalSearch from './global-search.vue';
import Settings from './settings.vue';
import { getDirectusAppProvides } from './utils/get-directus-app';
import { injectCommandPalette } from './utils/inject-command-palette';
import { injectSearchBar } from './utils/inject-search-bar';
import { syncSettingsMirror } from './utils/settings-mirror';

registerCommands(
	searchCommands,
	collectionItemFlowCommands,
	versionCommands,
	previewCommands,
	copyApiUrlCommands,
	contentCommands,
	bookmarkCommands,
	usersCommands,
	filesCommands,
	insightsCommands,
	dataModelCommands,
	settingsCommands,
	deploymentsCommands,
	flowCommands,
	accountCommands,
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
		const provides = getDirectusAppProvides();

		syncSettingsMirror(provides[STORES_INJECT], provides[API_INJECT]).catch((error) => {
			console.warn('Could not copy the command palette settings for non-admin users', error);
		});

		return true;
	},
});
