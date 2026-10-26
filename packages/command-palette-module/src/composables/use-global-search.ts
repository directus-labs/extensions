import type { Ref } from 'vue';
import type { CollectionSearchResult, SearchCollectionType } from '../types';
import { useApi, useStores } from '@directus/extensions-sdk';
import { getEndpoint, mergeFilters } from '@directus/utils';
import { isPlainObject } from 'lodash-es';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { createDeepObject } from '../utils/create-deep-object';
import { getItemRoute } from '../utils/get-item-route';
import { getReadableDisplayTemplate, getReadableFields } from '../utils/get-readable-display-template';
import { getRouteQueryValue } from '../utils/get-route-query-value';
import { isItemRouteAvailable } from '../utils/is-item-route-available';
import { useSettings } from './use-settings';
import { useUnexpectedError } from './use-unexpected-error';

const DEFAULT_RESULT_LIMIT = 5;
const MAX_PALETTE_RESULT_LIMIT = 25;
const MAX_PALETTE_COLLECTIONS = 20;
const SEARCH_CONCURRENCY = 5;
const DEFAULT_TRIGGER_RATE = 150;

interface GlobalSearchOptions {
	syncWithQuery?: boolean;
	query?: Ref<string | null>;
	globallyAvailableOnly?: boolean;
	minimumQueryLength?: number;
	searchAsYouType?: boolean;
}

export function useGlobalSearch(options: GlobalSearchOptions = {}) {
	const route = useRoute();
	const router = useRouter();
	const api = useApi();
	const stores = useStores();
	const unexpectedError = useUnexpectedError({ stores, i18n: useI18n() });
	const fieldsStore = stores.useFieldsStore();
	const collectionsStore = stores.useCollectionsStore();
	const permissionsStore = stores.usePermissionsStore();
	const { settings, collections: configuredCollections, valid } = useSettings(stores);
	const query = options.query ?? ref(options.syncWithQuery ? getRouteQueryValue(route.query.search) ?? null : null);
	const results = ref<CollectionSearchResult[]>([]);
	const loading = ref(false);
	const completedSearch = ref<{ query: string; requestId: number } | null>(null);
	const info = reactive({ query: '', hits: 0, time: 0 });
	const collections = computed(() => {
		const readable = configuredCollections.value.filter((config) => {
			if (!permissionsStore.hasPermission(config.collection, 'read')) return false;

			const itemRoute = getItemRoute(config.collection, '__command-palette-route-check__');
			return isItemRouteAvailable(router, itemRoute);
		});

		if (!options.globallyAvailableOnly) return readable;

		return readable
			.filter(({ availableGlobally }) => availableGlobally)
			.slice(0, MAX_PALETTE_COLLECTIONS);
	});
	let requestId = 0;
	let searchTimeout: ReturnType<typeof setTimeout> | undefined;
	let activeController: AbortController | undefined;
	let activeSearch: Promise<void> = Promise.resolve();

	watch(query, (value) => {
		if (searchTimeout) clearTimeout(searchTimeout);
		activeController?.abort();

		const normalized = value?.trim() ?? '';
		const currentRequest = ++requestId;

		results.value = [];
		info.query = '';
		info.hits = 0;
		info.time = 0;

		if (normalized.length < (options.minimumQueryLength ?? 1)) {
			loading.value = false;
			if (!normalized && options.syncWithQuery) void removeSearchQuery().catch(unexpectedError);
			return;
		}

		const asYouType = options.searchAsYouType ?? settings.value?.searchMode === 'as_you_type';

		if (!asYouType) {
			loading.value = false;
			return;
		}

		loading.value = true;

		searchTimeout = setTimeout(() => {
			searchTimeout = undefined;
			void search(normalized, currentRequest);
		}, getTriggerRate(settings.value?.triggerRate));
	});

	onBeforeUnmount(() => {
		requestId++;
		if (searchTimeout) clearTimeout(searchTimeout);
		activeController?.abort();
		loading.value = false;
	});

	if (query.value) void search(query.value);

	async function search(value: string | null, existingRequestId?: number) {
		const normalized = value?.trim() ?? '';
		if (normalized.length < (options.minimumQueryLength ?? 1)) return;
		if (existingRequestId !== undefined && existingRequestId !== requestId) return;

		if (existingRequestId === undefined && searchTimeout) {
			clearTimeout(searchTimeout);
			searchTimeout = undefined;
		}

		const currentRequest = existingRequestId ?? ++requestId;
		activeController?.abort();
		loading.value = true;
		results.value = [];
		info.query = normalized;
		info.hits = 0;
		info.time = 0;

		const previousSearch = activeSearch;
		const nextSearch = previousSearch.then(async () => {
			if (currentRequest !== requestId) return;

			const controller = new AbortController();
			activeController = controller;

			try {
				if (options.syncWithQuery) {
					await router.replace({ query: { ...route.query, search: normalized } });
				}

				if (currentRequest !== requestId || controller.signal.aborted) return;

				const startedAt = Date.now();
				const settled = await mapWithConcurrency(
					collections.value,
					SEARCH_CONCURRENCY,
					(config) => searchCollection(config, normalized, controller.signal),
					controller.signal,
				);

				if (currentRequest !== requestId || controller.signal.aborted) return;

				const failure = settled.find(
					(result): result is PromiseRejectedResult => result.status === 'rejected',
				);
				if (failure) unexpectedError(failure.reason);

				results.value = settled.flatMap((result) =>
					result.status === 'fulfilled' && result.value ? [result.value] : [],
				);

				info.hits = results.value.reduce((total, result) => total + result.hits.length, 0);
				info.time = Date.now() - startedAt;
				completedSearch.value = { query: normalized, requestId: currentRequest };
			}
			catch (error) {
				if (!controller.signal.aborted && currentRequest === requestId) unexpectedError(error);
			}
			finally {
				if (currentRequest === requestId) loading.value = false;
				if (activeController === controller) activeController = undefined;
			}
		});

		activeSearch = nextSearch;
		await nextSearch;
	}

	async function searchCollection(
		config: SearchCollectionType,
		value: string,
		signal: AbortSignal,
	): Promise<CollectionSearchResult | null> {
		const primaryKeyField = fieldsStore.getPrimaryKeyFieldForCollection(config.collection)?.field ?? 'id';
		const { template: displayTemplate, fields: displayFields } = getReadableDisplayTemplate(
			fieldsStore,
			config.collection,
			config.displayTemplate || collectionsStore.getCollection(config.collection)?.meta?.display_template,
			primaryKeyField,
		);
		const searchFields = getReadableFields(fieldsStore, config.collection, config.fields);
		if (searchFields.length === 0) return null;

		const [descriptionField] = getReadableFields(fieldsStore, config.collection, [config.descriptionField ?? '']);
		const filter = mergeFilters(config.filter ?? null, {
			_or: searchFields.map((field) => createDeepObject(field, { _icontains: value })),
		});
		const response = await api.get(getEndpoint(config.collection), {
			signal,
			params: {
				limit: options.globallyAvailableOnly
					? getPaletteResultLimit(config.limit)
					: config.limit ?? DEFAULT_RESULT_LIMIT,
				sort: config.sort ?? [primaryKeyField],
				filter,
				fields: [primaryKeyField, descriptionField, ...displayFields].filter(Boolean),
			},
		});
		const data: unknown = response.data.data;
		const hits = Array.isArray(data)
			? data
					.filter((item: unknown): item is Record<string, any> => isPlainObject(item))
					.filter((item) => item[primaryKeyField] !== null && item[primaryKeyField] !== undefined)
			: [];

		if (hits.length === 0) return null;

		return {
			collection: config.collection,
			hits,
			primaryKeyField,
			displayTemplate,
			...(descriptionField ? { descriptionField } : {}),
		};
	}

	function clear() {
		requestId++;
		if (searchTimeout) clearTimeout(searchTimeout);
		activeController?.abort();
		query.value = null;
		info.query = '';
		info.hits = 0;
		info.time = 0;
		results.value = [];
		loading.value = false;
	}

	async function removeSearchQuery() {
		const nextQuery = { ...route.query };
		delete nextQuery.search;
		await router.replace({ query: nextQuery });
	}

	return { query, results, settings, settingsValid: valid, loading, completedSearch, info, collections, clear, search };
}

export function getPaletteResultLimit(limit: number | null | undefined) {
	if (limit === -1) return MAX_PALETTE_RESULT_LIMIT;
	if (typeof limit !== 'number' || !Number.isFinite(limit)) return DEFAULT_RESULT_LIMIT;
	return Math.min(MAX_PALETTE_RESULT_LIMIT, Math.max(1, limit));
}

function getTriggerRate(value: number | undefined) {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0
		? value
		: DEFAULT_TRIGGER_RATE;
}

async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	callback: (item: T) => Promise<R>,
	signal?: AbortSignal,
): Promise<PromiseSettledResult<R>[]> {
	const results: PromiseSettledResult<R>[] = [];
	let nextIndex = 0;

	await Promise.all(
		Array.from({ length: Math.min(concurrency, items.length) }, async () => {
			while (nextIndex < items.length && !signal?.aborted) {
				const index = nextIndex++;
				const item = items[index];
				if (item === undefined) continue;

				try {
					results[index] = { status: 'fulfilled', value: await callback(item) };
				}
				catch (error) {
					results[index] = { status: 'rejected', reason: error };
				}
			}
		}),
	);

	return results;
}
