import { useApi, useStores } from '@directus/extensions-sdk';
import { ref } from 'vue';
import { trimSlashes } from '../../shared/engine';
import { BASE_PATH, COLLECTIONS } from '../../shared/tables';

export interface MockCollectionRow {
	id: number;
	name: string;
	prefix: string;
	enabled: boolean;
	description: string | null;
}

const collections = ref<MockCollectionRow[]>([]);
const setupError = ref<string | null>(null);
let loading: Promise<void> | null = null;

export function useMockApi() {
	const api = useApi();
	const { useCollectionsStore, useFieldsStore, useRelationsStore, useNotificationsStore } = useStores();
	const collectionsStore = useCollectionsStore();
	const notifications = useNotificationsStore();

	async function ensureStores() {
		if (collectionsStore.getCollection(COLLECTIONS)) return;
		await Promise.all([collectionsStore.hydrate(), useFieldsStore().hydrate(), useRelationsStore().hydrate()]);
	}

	async function refresh() {
		const list = await api.get(`/items/${COLLECTIONS}`, {
			params: { fields: ['id', 'name', 'prefix', 'enabled', 'description'], sort: ['sort', 'id'], limit: -1 },
		});

		collections.value = list.data.data;
	}

	function load() {
		loading ??= (async () => {
			setupError.value = null;

			try {
				await ensureStores();

				if (!collectionsStore.getCollection(COLLECTIONS)) {
					setupError.value = 'The Mock API collections are missing. Restart the API so the extension can create them.';
					return;
				}

				await refresh();
			}
			catch (error: any) {
				setupError.value = error?.response?.data?.errors?.[0]?.message ?? String(error);
			}
			finally {
				loading = null;
			}
		})();

		return loading;
	}

	function servedAt(prefix: string, path = '') {
		const parts = [BASE_PATH, prefix, path].map(trimSlashes).filter(Boolean);
		return `/${parts.join('/')}`;
	}

	function notify(title: string, type: 'success' | 'error' = 'success') {
		notifications.add({ title, type, closeable: true, persist: type === 'error' });
	}

	function errorMessage(error: any): string {
		return error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Something went wrong.';
	}

	function failedValidations(error: any): Record<string, unknown>[] {
		const errors: { extensions?: { code?: string } }[] = error?.response?.data?.errors ?? [];
		return errors.filter((e) => e.extensions?.code === 'FAILED_VALIDATION').map((e) => e.extensions!);
	}

	return {
		api,
		collections,
		setupError,
		load,
		refresh,
		servedAt,
		notify,
		errorMessage,
		failedValidations,
	};
}
