import type { CommandActionContext, CommandConfig } from '../command-palette';
import { get } from 'lodash-es';
import { defineCommands, getSessionValue } from '../command-palette';
import { getDirectusRouter } from '../utils/get-directus-router';
import { getEndpoint } from '../utils/get-endpoint';
import { getFieldsFromTemplate } from '../utils/get-fields-from-template';
import { getRoutePrimaryKey } from '../utils/get-route-primary-key';
import { getRouteVersionContext } from '../utils/get-route-version-context';
import { isModuleEnabled } from '../utils/is-module-enabled';
import { isServerVersionAtLeast } from '../utils/is-server-version-at-least';
import { getItemVersions } from './versions';

const PREVIEW_BASE_URL = '$preview_base_url';

export const previewCommands = defineCommands({
	commands: ({ route, stores, api }): CommandConfig[] => {
		const collection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const primaryKey = getRoutePrimaryKey(route.params.primaryKey);
		if (!collection || !primaryKey || !route.path.startsWith(`/content/${collection}/`)) return [];

		const settings = stores.useSettingsStore().settings;
		const template: unknown = stores.useCollectionsStore().getCollection(collection)?.meta?.preview_url;
		// Directus 12 resolves $preview_base_url from the project settings and treats the preview as unset without it.
		const baseUrl = String(settings?.preview_base_url ?? '').replace(/\/+$/, '');
		const templateFields = typeof template === 'string' ? getFieldsFromTemplate(template) : [];
		if (typeof template !== 'string' || !template || (templateFields.includes(PREVIEW_BASE_URL) && !baseUrl)) return [];

		const versionKey = getRouteVersionContext(route).versionKey;
		const itemQuery = versionKey ? { version: versionKey } : undefined;
		const itemPath = `/content/${encodeURIComponent(collection)}/${encodeURIComponent(primaryKey)}`;

		const commands: CommandConfig[] = [
			{
				id: 'open-live-preview',
				name: 'Open Live Preview',
				icon: 'visibility',
				group: 'context',
				keywords: ['preview'],
				priority: 51,
				// The same full-page preview Studio opens for its popup mode, rendered by Studio for the current version.
				action: ({ router }: CommandActionContext) => {
					window.open(router.resolve({ path: `${itemPath}/preview`, query: itemQuery }).href, '_blank', 'noopener');
				},
			},
		];

		const visualEditorUrls = (settings?.visual_editor_urls as { url?: string }[] | null | undefined)
			?.map(({ url }) => url)
			.filter((url): url is string => !!url) ?? [];

		// Directus 11.6 has a visual editor page but no route that opens it on a given URL.
		const canOpenVisualEditor = visualEditorUrls.length > 0
			&& isModuleEnabled(stores, 'visual')
			&& getDirectusRouter()?.hasRoute('visual-editor-url') === true;

		if (!canOpenVisualEditor) return commands;

		const versionVariable = getPreviewVersion();
		if (!versionVariable) return commands;

		const injected = { $version: versionVariable, [PREVIEW_BASE_URL]: baseUrl };
		// Studio fetches indexed relations (translations[0].slug) without the index and applies it when rendering.
		const itemFields = [...new Set(templateFields.filter((field) => !(field in injected)).map(stripFieldIndex))];

		const item = getSessionValue(`preview-item:${collection}:${primaryKey}:${itemFields.join(',')}`, async (signal) => {
			if (itemFields.length === 0) return {};

			const { data } = await api.get(`${getEndpoint(collection)}/${encodeURIComponent(primaryKey)}`, {
				params: { fields: itemFields },
				signal,
			});

			return data.data as Record<string, unknown>;
		});

		const previewUrl = item && renderTemplate(template, { ...item, ...injected });
		const allowed = previewUrl && visualEditorUrls.some((url) =>
			sameOrigin(renderTemplate(url, { $version: versionVariable }) ?? url, previewUrl));

		if (allowed) {
			commands.unshift({
				id: 'open-visual-editor',
				name: 'Open in Visual Editor',
				icon: 'edit_square',
				group: 'context',
				keywords: ['visual', 'editor', 'preview'],
				priority: 51,
				action: ({ router }: CommandActionContext) => {
					router.push(`/visual/${previewUrl}`);
				},
			});
		}

		return commands;

		// Studio's live preview passes the published key for main; Directus 12 renamed it from main to published, and
		// also uses it until the selected version is saved (an unsaved draft). Undefined while the versions load.
		function getPreviewVersion() {
			if (!isServerVersionAtLeast(stores, '12.0.0')) return versionKey ?? 'main';
			if (!versionKey || !stores.usePermissionsStore().hasPermission('directus_versions', 'read')) return 'published';

			const versions = getItemVersions(api, collection!, primaryKey!);
			return versions && (versions.some(({ key }) => key === versionKey) ? versionKey : 'published');
		}
	},
});

// Same as Studio's use-template-data.
function stripFieldIndex(field: string) {
	return field
		.replaceAll(/\[\d+\]/g, '')
		.split('.')
		.filter((part) => part !== '' && !/^\d+$/.test(part))
		.join('.');
}

// Like Studio, a template referencing a missing value doesn't render.
function renderTemplate(template: string, values: Record<string, unknown>) {
	let complete = true;

	const rendered = template.replaceAll(/\{\{(.*?)\}\}/g, (_, path: string) => {
		const value = get(values, path.trim());
		if (value === undefined) complete = false;
		if (value === null || value === undefined) return '';
		return typeof value === 'object' ? JSON.stringify(value) : String(value);
	});

	return complete ? rendered.trim() || null : null;
}

function sameOrigin(a: string, b: string) {
	try {
		return new URL(a).origin === new URL(b).origin;
	}
	catch {
		return false;
	}
}
