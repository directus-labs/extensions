import type { CommandActionContext } from '../command-palette';
import { defineCommands } from '../command-palette';
import { getEndpoint } from '../utils/get-endpoint';
import { getPublicURL } from '../utils/get-root-path';
import { getRoutePrimaryKey } from '../utils/get-route-primary-key';
import { getRouteVersionContext } from '../utils/get-route-version-context';

export const copyApiUrlCommands = defineCommands({
	commands: ({ route, stores, i18n }) => {
		const collection = typeof route.params.collection === 'string' ? route.params.collection : undefined;
		const primaryKey = getRoutePrimaryKey(route.params.primaryKey);
		const versionContext = getRouteVersionContext(route);

		if (!collection || !route.path.startsWith(`/content/${collection}`)) return [];
		if (versionContext.versionKey && route.params.primaryKey === '+' && versionContext.versionId) return [];

		// Same feedback as Studio's own copy buttons.
		async function copy(text: string) {
			const notificationsStore = stores.useNotificationsStore();

			try {
				await navigator.clipboard.writeText(text);
				notificationsStore.add({ title: i18n.t('copy_raw_value_success') });
				return true;
			}
			catch {
				notificationsStore.add({ type: 'error', title: i18n.t('copy_raw_value_fail') });
				return false;
			}
		}

		return [
			{
				id: 'copy-api-url',
				name: 'Copy API URL',
				icon: 'content_copy',
				group: 'context',
				priority: 50,
				action: () => {
					const endpoint = getEndpoint(collection).slice(1);
					const path = `${endpoint}${primaryKey ? `/${encodeURIComponent(primaryKey)}` : ''}`;
					const url = new URL(path, getPublicURL());

					if (primaryKey && versionContext.versionKey) {
						url.searchParams.set('version', versionContext.versionKey);
					}

					return copy(url.toString());
				},
			},
			...(primaryKey
				? [
						{
							id: 'copy-item-link',
							name: 'Copy Item Link',
							icon: 'link',
							group: 'context',
							keywords: ['url', 'share'],
							priority: 50,
							action: ({ router }: CommandActionContext) => {
								const query = versionContext.versionKey ? { version: versionContext.versionKey } : undefined;
								const href = router.resolve({ path: route.path, query }).href;
								return copy(new URL(href, window.location.href).toString());
							},
						},
						{
							id: 'copy-item-id',
							name: 'Copy ID',
							icon: 'tag',
							group: 'context',
							keywords: ['primary key'],
							priority: 50,
							action: () => copy(primaryKey),
						},
					]
				: []),
		];
	},
});
