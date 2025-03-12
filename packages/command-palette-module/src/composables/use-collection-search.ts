import type { Filter, Item } from '@directus/types';
import type { MaybeRef, Ref } from 'vue';
import { useApi, useCollection, useStores } from '@directus/extensions-sdk';
import { getFieldsFromTemplate, mergeFilters } from '@directus/utils';
import { useDebounceFn } from '@vueuse/core';
import { uniqBy } from 'lodash-es';
import { computed, ref, unref, watch } from 'vue';
import { createDeepObject } from '../utils/create-deep-object';
import { useSettings } from './use-settings';

interface UseCollectionSearchOptions {
	prefetch?: number | false;
}

export function useCollectionSearch(
	collection: MaybeRef<string>,
	search: Ref<string>,
	options: UseCollectionSearchOptions = {},
) {
	const { prefetch = 10 } = options;
	const loading = ref(false);
	const error = ref<unknown>(null);
	const api = useApi();
	const { settings, collections } = useSettings();
	const { useFieldsStore } = useStores();
	const fieldsStore = useFieldsStore();
	const results = ref<Item[]>([]);
	const performedQueries = new Set<string>();

	const collectionSearchInfo = computed(() =>
		collections.value.find((info) => info.collection === unref(collection)),
	);

	const { info: collectionInfo } = useCollection(
		collection as Parameters<typeof useCollection>[0],
	);

	const displayTemplate = computed(
		() =>
			collectionSearchInfo.value?.displayTemplate
			?? collectionInfo.value?.meta?.display_template,
	);

	const displayFields = computed(
		() => getFieldsFromTemplate(displayTemplate.value) ?? [],
	);

	const primaryKeyField = computed(
		() =>
			fieldsStore.getPrimaryKeyFieldForCollection(collection)?.field ?? 'id',
	);

	const info = computed(() => ({
		...collectionSearchInfo.value,
		icon: collectionInfo.value?.icon ?? 'search',
		primaryKeyField: primaryKeyField.value,
		displayTemplate: displayTemplate.value,
	}));

	const debouncedSearch = useDebounceFn(
		performSearch,
		settings.value?.triggerRate ?? 100,
		{
			maxWait: settings.value?.triggerRate ?? 100,
		},
	);

	watch([collection, search], ([_, newSearch], [__, oldSearch]) => {
		if (!collectionSearchInfo.value)
			return;
		if (performedQueries.has(newSearch as string))
			return;

		loading.value = true;

		if (!oldSearch) {
			performSearch();
		}
		else {
			if (!newSearch && prefetch) {
				fetch(prefetch, null);
			}

			debouncedSearch();
		}
	});

	if (prefetch) {
		fetch(prefetch, null);
	}

	return {
		loading,
		results,
		info,
	};

	async function fetch(limit: number, searchFilter: Filter | null) {
		const _collection = unref(collection);

		const { sort, filter, descriptionField, thumbnailField } =
      collectionSearchInfo.value!;

		const query = {
			limit,
			sort: sort ?? [primaryKeyField.value],
			filter: mergeFilters(filter ?? null, searchFilter),
			fields: [
				primaryKeyField.value,
				descriptionField,
				thumbnailField,
				...displayFields.value,
			].filter(Boolean),
		};

		// Update the url if the collection is a directus system collection
		const endpoint = _collection.startsWith('directus_')
			? _collection.replace('directus_', '')
			: `/items/${_collection}`;

		try {
			const { data } = await api.get(endpoint, { params: query });

			results.value = uniqBy(
				[...results.value, ...data.data],
				primaryKeyField.value,
			);
		}
		catch (error_) {
			error.value = error_;
			results.value = [];
		}
		finally {
			loading.value = false;
		}
	}

	async function performSearch() {
		const _search = unref(search);

		if (!_search || performedQueries.has(_search)) {
			loading.value = false;
			return;
		}

		const { fields, limit } = collectionSearchInfo.value!;

		const searchFilter: Filter = {
			_or: fields.map((field: string) =>
				createDeepObject(field, {
					_icontains: _search,
				}),
			),
		};

		await fetch(limit ?? 5, searchFilter);

		performedQueries.add(_search);
	}
}
