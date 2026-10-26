import type { useStores } from '@directus/extensions-sdk';
import type { RouteLocationRaw } from 'vue-router';
import { getDirectusRouter } from '../../utils/get-directus-router';
import { getFlowsPath } from '../../utils/get-flows-path';

export interface SettingsSection {
	id: string;
	name: string;
	icon: string;
	to: RouteLocationRaw;
}

const baseSections: SettingsSection[] = [
	{ id: 'roles', name: 'Roles & Policies', icon: 'group', to: '/settings/roles' },
	{ id: 'permissions', name: 'Access Policies', icon: 'admin_panel_settings', to: '/settings/policies' },
	{ id: 'project', name: 'Project Settings', icon: 'tune', to: '/settings/project' },
	{ id: 'appearance', name: 'Appearance', icon: 'palette', to: '/settings/appearance' },
	{ id: 'global-search', name: 'Command Palette Settings', icon: 'search', to: { name: 'global-search-settings' } },
	{ id: 'presets', name: 'Presets & Bookmarks', icon: 'bookmark', to: '/settings/presets' },
	{ id: 'translations', name: 'Translations', icon: 'translate', to: '/settings/translations' },
];

export function getSettingsSections(stores: ReturnType<typeof useStores>): SettingsSection[] {
	const serverInfo = stores.useServerStore?.().info;
	const sections = [
		{ id: 'flows', name: 'Flows', icon: 'bolt', to: getFlowsPath(getDirectusRouter()) },
		...baseSections,
	];

	if (serverInfo?.ai_enabled || serverInfo?.mcp_enabled) {
		sections.push({ id: 'ai', name: 'AI', icon: 'smart_toy', to: '/settings/ai' });
	}

	sections.push(
		{ id: 'marketplace', name: 'Marketplace', icon: 'storefront', to: '/settings/marketplace' },
		{ id: 'extensions', name: 'Extensions', icon: 'category', to: '/settings/extensions' },
	);

	if (typeof serverInfo?.websocket === 'object' && serverInfo.websocket?.logs) {
		sections.push({ id: 'system-logs', name: 'System Logs', icon: 'terminal', to: '/settings/system-logs' });
	}

	return sections;
}
