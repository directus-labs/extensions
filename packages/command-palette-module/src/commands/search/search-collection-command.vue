<script setup lang="ts">
import type { RecentItem } from '../../command-palette/composables/use-recent-items';
import { useApi, useStores } from '@directus/extensions-sdk';
import { isPlainObject } from 'lodash-es';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Empty, Group, Item, List, useCommandContext } from '../../command-palette';
import { useRecentItems } from '../../command-palette/composables/use-recent-items';
import DescriptionBoundary from '../../components/description-boundary.vue';
import Highlights from '../../components/highlights.vue';
import { getPaletteResultLimit } from '../../composables/use-global-search';
import { useSettings } from '../../composables/use-settings';
import { createDeepObject } from '../../utils/create-deep-object';
import { getDescriptionDisplay, hasDescriptionValue } from '../../utils/get-description-display';
import { getEndpoint } from '../../utils/get-endpoint';
import { getItemRoute } from '../../utils/get-item-route';
import { getReadableDisplayTemplate, getReadableFields } from '../../utils/get-readable-display-template';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { getRouteVersionContext } from '../../utils/get-route-version-context';
import { isItemRouteAvailable } from '../../utils/is-item-route-available';
import { mergeFilters } from '../../utils/merge-filters';

interface SearchResult {
	item: Record<string, any>;
	pk: string;
	versionKey?: string;
	versionId?: string;
}

const props = withDefaults(
	defineProps<{
		collection: string;
		collectionName?: string;
		collectionIcon?: string;
		displayTemplate?: string | null;
	}>(),
	{
		collectionName: '',
		collectionIcon: '',
		displayTemplate: null,
	},
);

const api = useApi();
const route = useRoute();
const router = useRouter();
const stores = useStores();
const i18n = useI18n();
const { useCollectionsStore, useFieldsStore } = stores;
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const currentUserId = stores.useUserStore().currentUser?.id;
const settings = useSettings(stores);
const { search, loading, close } = useCommandContext();

const collectionConfig = computed(() =>
	settings.collections.value.find(({ collection }) => collection === props.collection),
);
const collection = computed(() => collectionsStore.getCollection(props.collection));
const collectionName = computed(() => props.collectionName || String(collection.value?.name ?? props.collection));
const collectionIcon = computed(() => {
	const icon = collection.value?.meta?.icon;
	return props.collectionIcon || (typeof icon === 'string' ? icon : 'search');
});
const primaryKeyField = computed(() => fieldsStore.getPrimaryKeyFieldForCollection(props.collection)?.field ?? 'id');
const readableDisplayTemplate = computed(() => getReadableDisplayTemplate(
	fieldsStore,
	props.collection,
	props.displayTemplate || collectionConfig.value?.displayTemplate || collection.value?.meta?.display_template,
	primaryKeyField.value,
));
const itemTemplate = computed(() => readableDisplayTemplate.value.template);
const descriptionField = computed(() =>
	getReadableFields(fieldsStore, props.collection, [collectionConfig.value?.descriptionField ?? ''])[0] ?? null,
);
const descriptionDisplay = computed(() =>
	descriptionField.value ? getDescriptionDisplay(fieldsStore, props.collection, descriptionField.value) : null,
);
const fields = computed(() => [
	primaryKeyField.value,
	descriptionField.value,
	...readableDisplayTemplate.value.fields,
].filter(Boolean));
const versionContext = computed(() => getRouteVersionContext(route));
const searchVersionKey = computed(() =>
	route.params.collection === props.collection ? versionContext.value.versionKey : undefined,
);
const currentPrimaryKey = computed(() => {
	if (!route.path.startsWith(`/content/${props.collection}/`)) return;
	return getRoutePrimaryKey(route.params.primaryKey) ?? (route.params.primaryKey === '+' ? '+' : undefined);
});
const results = ref<SearchResult[]>([]);
const { items: storedRecentItems, add: addRecentItem } = useRecentItems(currentUserId, props.collection);
const recentItems = ref<SearchResult[]>([]);
const recentItemsLoading = ref(true);
const showRecents = computed(() => !search.value && recentItems.value.length > 0);
const showHint = computed(() => !search.value && !recentItemsLoading.value && recentItems.value.length === 0);
const isEmpty = computed(() => !!search.value && !loading.value && results.value.length === 0);
let searchTimeout: ReturnType<typeof setTimeout> | undefined;
let activeController: AbortController | undefined;
let recentItemsController: AbortController | undefined;
let requestId = 0;

onMounted(() => void loadRecentItems());

watch(search, (value) => {
	if (searchTimeout) clearTimeout(searchTimeout);
	activeController?.abort();

	const currentRequest = ++requestId;
	const query = value.trim();
	results.value = [];

	if (!query) {
		loading.value = false;
		return;
	}

	loading.value = true;

	searchTimeout = setTimeout(() => {
		searchTimeout = undefined;
		void fetchItems(query, currentRequest);
	}, settings.settings.value?.triggerRate ?? 150);
});

onBeforeUnmount(() => {
	requestId++;
	if (searchTimeout) clearTimeout(searchTimeout);
	activeController?.abort();
	recentItemsController?.abort();
	loading.value = false;
});

async function fetchItems(query: string, currentRequest: number) {
	const controller = new AbortController();
	activeController = controller;

	try {
		const response = await api.get(getEndpoint(props.collection), {
			signal: controller.signal,
			params: {
				...getSearchParams(query),
				fields: fields.value,
				...(searchVersionKey.value ? { version: searchVersionKey.value } : {}),
			},
		});

		if (currentRequest !== requestId || controller.signal.aborted) return;

		const items = getResponseItems(response.data.data);

		results.value = items.flatMap((item) => {
			const rawPrimaryKey = item[primaryKeyField.value];
			const versionId = item.$meta?.version_id;
			// Hosts before v12 ignore `version` on list requests and return main items without $meta.
			const versionKey = versionId != null ? searchVersionKey.value : undefined;
			const itemlessDraft = versionKey !== undefined && rawPrimaryKey === null;

			if (rawPrimaryKey === undefined || (rawPrimaryKey === null && !itemlessDraft)) return [];

			const result: SearchResult = {
				item,
				pk: itemlessDraft ? '+' : String(rawPrimaryKey),
				...(versionKey ? { versionKey } : {}),
				...(itemlessDraft ? { versionId: String(versionId) } : {}),
			};

			return isCurrentItem(result) ? [] : [result];
		});
	}
	catch (error) {
		if (currentRequest === requestId && !controller.signal.aborted) {
			results.value = [];
			// Logged, not a dialog: a bad configured filter or sort fails every keystroke.
			console.error(error);
		}
	}
	finally {
		if (currentRequest === requestId) loading.value = false;
		if (activeController === controller) activeController = undefined;
	}
}

// Configured collections keep their search fields, filter, sort and limit. Unconfigured ones, or ones whose
// search fields the user can't read, use full-text search.
function getSearchParams(query: string) {
	const config = collectionConfig.value;
	const searchFields = config ? getReadableFields(fieldsStore, props.collection, config.fields) : [];
	if (!config || searchFields.length === 0) return { search: query, limit: 25 };

	return {
		filter: mergeFilters(config.filter ?? null, {
			_or: searchFields.map((field) => createDeepObject(field, { _icontains: query })),
		}),
		sort: config.sort ?? [primaryKeyField.value],
		limit: getPaletteResultLimit(config.limit),
	};
}

async function loadRecentItems() {
	const controller = new AbortController();
	recentItemsController = controller;

	try {
		const settled = await Promise.allSettled(
			storedRecentItems.value
				.filter((item) => !isCurrentItem(item))
				.map((item) => fetchRecentItem(item, controller.signal)),
		);

		if (controller.signal.aborted) return;

		for (const result of settled) {
			if (result.status === 'rejected') console.error(result.reason);
		}

		recentItems.value = settled.flatMap((result) =>
			result.status === 'fulfilled' && result.value ? [result.value] : [],
		);
	}
	finally {
		if (recentItemsController === controller) recentItemsController = undefined;
		recentItemsLoading.value = false;
	}
}

async function fetchRecentItem(item: RecentItem, signal: AbortSignal) {
	const response = await api.get(getEndpoint(props.collection), {
		signal,
		params: {
			fields: fields.value,
			limit: item.pk === '+' ? 25 : 1,
			...(item.pk === '+' ? {} : { filter: { [primaryKeyField.value]: { _eq: item.pk } } }),
			...(item.versionKey ? { version: item.versionKey } : {}),
		},
	});
	const match = getResponseItems(response.data.data).find((result) => matchesRecentItem(result, item));
	if (!match) return null;

	return {
		item: match,
		pk: item.pk,
		...(item.versionKey ? { versionKey: item.versionKey } : {}),
		...(item.versionId ? { versionId: item.versionId } : {}),
	};
}

function getResponseItems(data: unknown) {
	return Array.isArray(data)
		? data.filter((item: unknown): item is Record<string, any> => isPlainObject(item))
		: [];
}

function matchesRecentItem(item: Record<string, any>, recentItem: RecentItem) {
	const primaryKey = item[primaryKeyField.value];
	if (recentItem.pk !== '+') return primaryKey != null && String(primaryKey) === recentItem.pk;

	const versionId = item.$meta?.version_id;
	return primaryKey === null && versionId != null && String(versionId) === recentItem.versionId;
}

function selectItem(item: SearchResult) {
	const singleton = collection.value?.meta?.singleton === true;
	const itemRoute = item.versionKey
		? getItemRoute(props.collection, item.pk, {
				versionKey: item.versionKey,
				...(item.versionId ? { versionId: item.versionId } : {}),
				...(singleton ? { singleton: true } : {}),
			})
		: getItemRoute(props.collection, item.pk, singleton ? { singleton: true } : undefined);

	if (!isItemRouteAvailable(router, itemRoute)) return;

	addRecentItem({
		collection: props.collection,
		pk: item.pk,
		...(item.versionKey ? { versionKey: item.versionKey } : {}),
		...(item.versionId ? { versionId: item.versionId } : {}),
	});

	router.push(itemRoute);
	close();
}

function isCurrentItem(item: { pk: string; versionKey?: string; versionId?: string }) {
	if (item.pk !== currentPrimaryKey.value) return false;
	return item.versionKey === versionContext.value.versionKey && item.versionId === versionContext.value.versionId;
}

function itemValue(item: { pk: string; versionKey?: string; versionId?: string }) {
	return JSON.stringify([item.pk, item.versionKey ?? null, item.versionId ?? null]);
}
</script>

<template>
	<List :search-bar-placeholder="`Search ${collectionName}...`">
		<Group v-if="showRecents" :heading="String(i18n.t('recent'))">
			<Item
				v-for="item in recentItems"
				:key="itemValue(item)"
				:value="`recent:${itemValue(item)}`"
				:icon="collectionIcon"
				@select="selectItem(item)"
			>
				<render-template :collection="props.collection" :item="item.item" :template="itemTemplate" />
			</Item>
		</Group>
		<Empty :show="showHint">
			Type to search {{ collectionName }}
		</Empty>
		<Empty :show="isEmpty" />
		<DescriptionBoundary v-slot="{ failed }" :results="results">
			<Group v-if="results.length > 0">
				<Item
					v-for="result in results"
					:key="itemValue(result)"
					:value="itemValue(result)"
					:icon="collectionIcon"
					@select="selectItem(result)"
				>
					<render-template :collection="props.collection" :item="result.item" :template="itemTemplate" />
					<template v-if="descriptionField && hasDescriptionValue(result.item[descriptionField])" #description>
						<component
							:is="descriptionDisplay.component"
							v-if="descriptionDisplay && !failed.has(itemValue(result))"
							v-bind="descriptionDisplay.props"
							:value="result.item[descriptionField]"
							:data-description-key="itemValue(result)"
						/>
						<Highlights v-else :text="String(result.item[descriptionField])" :query="search" />
					</template>
				</Item>
			</Group>
		</DescriptionBoundary>
	</List>
</template>
