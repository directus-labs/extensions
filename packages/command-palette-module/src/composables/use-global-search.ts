import type { Ref } from 'vue';
import type { CollectionSearchResult } from '../types';
import {
	getFieldsFromTemplate,
	useApi,
	useStores,
} from '@directus/extensions-sdk';
import { mergeFilters } from '@directus/utils';
import { useDebounceFn } from '@vueuse/core';
import { reactive, ref, unref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createDeepObject } from '../utils/create-deep-object';
import { useSettings } from './use-settings';

interface GlobalSearchOptions {
	syncWithQuery?: boolean;
}

export function useGlobalSearch(options?: GlobalSearchOptions) {
	const route = useRoute();
	const router = useRouter();

	const api = useApi();
	const { settings, collections, valid } = useSettings();

	// If there's a query for search in the url, set it as the query
	const query: Ref<string | null> = ref(
		options?.syncWithQuery ? (route.query?.search as string) ?? null : null,
	);

	const results: Ref<CollectionSearchResult[]> = ref([]);
	const loading = ref(false);
	const { useFieldsStore } = useStores();
	const fieldsStore = useFieldsStore();

	const info = reactive({
		query: '',
		hits: 0,
		time: 0,
	});

	const debouncedSearch = useDebounceFn(
		() => {
			if (query.value) {
				search(query.value);
			}
			else {
				loading.value = false;
			}
		},
		unref(settings)?.triggerRate ?? 100,
		{
			maxWait: unref(settings)?.triggerRate ?? 100,
		},
	);

	async function search(value: string) {
		try {
			// Initial search state so we don't show any results before a user has searched
			info.query = value;

			loading.value = true;

			if (options?.syncWithQuery) {
				// Set the query in the url for history purposes, but use replace to avoid adding a million entries to the history
				router.replace({ query: { search: value } });
			}

			// We're tracking the time it takes to search and the number of hits
			const startedAt = Date.now();

			const searchPromises = unref(collections).map(async (index) => {
				try {
					const {
						collection,
						displayTemplate,
						descriptionField,
						fields,
						filter,
						sort,
						limit,
					} = index;

					const displayFields = getFieldsFromTemplate(displayTemplate) || [];

					const primaryKeyField
            = fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field || 'id';

					// Use the mergeFilters utility to combine the existing query filter with the search filter
					const paramsFilter = mergeFilters(filter ?? null, {
						_or: fields.map((field) =>
							createDeepObject(field, {
								_icontains: unref(query),
							}),
						),
					});

					const params = {
						limit: limit ?? 5,
						sort: sort ?? [primaryKeyField],
						filter: paramsFilter,
						fields: [primaryKeyField, descriptionField, ...displayFields],
					};

					// Update the url if the collection is a directus system collection
					const url = collection.startsWith('directus_')
						? collection.replace('directus_', '')
						: `/items/${collection}`;

					const { data } = await api.get(url, { params });

					if (data.data.length > 0) {
						return {
							collection,
							hits: data.data,
							displayTemplate,
							descriptionField,
							primaryKeyField,
						};
					}
				}
				catch (error) {
					console.error(error);
				}

				return null;
			});

			// Wait for all searchPromises to resolve
			results.value = (await Promise.allSettled(searchPromises))
				.filter(
					<T>(
						result: PromiseSettledResult<T>,
					): result is PromiseFulfilledResult<T> =>
						result.status === 'fulfilled',
				)
				.map((result) => result.value)
				.filter(<T>(value: T | null): value is T => value !== null);

			// Add additional context for the user about the search
			info.hits = results.value
				.map(({ hits }) => hits.length)
				.reduce((a, b) => a + b, 0);

			info.time = Date.now() - startedAt;
			loading.value = false;
		}
		catch (error) {
			console.error(error);
			loading.value = false;
		}
	}

	function clear() {
		query.value = null;
		info.query = '';
		results.value = [];
		router.replace({ query: {} });
	}

	// If there's a search query in the url, go ahead and search immediately.
	if (query.value) {
		search(query.value);
	}

	// **Watchers**
	watch(query, (value, prevQuery) => {
		if (!value) {
			clear();
		}
		else if (unref(settings)?.searchMode === 'as_you_type') {
			// give some feedback to the user
			loading.value = true;

			if (!prevQuery) {
				// perform immediate search if the previous query is empty (this might be the first search)
				search(value);
			}
			else {
				debouncedSearch();
			}
		}
	});

	return {
		query,
		results,
		settings,
		settingsValid: valid,
		loading,
		info,
		collections,
		clear,
		search,
	};
}
