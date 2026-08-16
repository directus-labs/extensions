<script setup lang="ts">
import type { RecentItem } from '../../command-palette/composables/use-recent-items';
import { useApi, useStores } from '@directus/extensions-sdk';
import { getEndpoint, getFieldsFromTemplate } from '@directus/utils';
import { isPlainObject } from 'lodash-es';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Empty, Group, Item, List, useCommandContext } from '../../command-palette';
import { useRecentItems } from '../../command-palette/composables/use-recent-items';
import Highlights from '../../components/highlights.vue';
import { useSettings } from '../../composables/use-settings';
import { useUnexpectedError } from '../../composables/use-unexpected-error';
import { getItemRoute } from '../../utils/get-item-route';
import { getRoutePrimaryKey } from '../../utils/get-route-primary-key';
import { getRouteVersionContext } from '../../utils/get-route-version-context';
import { isItemRouteAvailable } from '../../utils/is-item-route-available';

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
const unexpectedError = useUnexpectedError({ stores, i18n });
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
const displayTemplate = computed(
	() => props.displayTemplate || collectionConfig.value?.displayTemplate || collection.value?.meta?.display_template || `{{${primaryKeyField.value}}}`,
);
const descriptionField = computed(() => collectionConfig.value?.descriptionField ?? null);
const fields = computed(() => [
	primaryKeyField.value,
	descriptionField.value,
	...(getFieldsFromTemplate(displayTemplate.value) ?? []),
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
				search: query,
				fields: fields.value,
				limit: 25,
				...(searchVersionKey.value ? { version: searchVersionKey.value } : {}),
			},
		});

		if (currentRequest !== requestId || controller.signal.aborted) return;

		const items = getResponseItems(response.data.data);

		results.value = items.flatMap((item) => {
			const rawPrimaryKey = item[primaryKeyField.value];
			const versionId = item.$meta?.version_id;
			const itemlessDraft = searchVersionKey.value !== undefined && rawPrimaryKey === null && versionId != null;

			if (rawPrimaryKey === undefined || (rawPrimaryKey === null && !itemlessDraft)) return [];

			const result: SearchResult = {
				item,
				pk: itemlessDraft ? '+' : String(rawPrimaryKey),
				...(searchVersionKey.value ? { versionKey: searchVersionKey.value } : {}),
				...(itemlessDraft ? { versionId: String(versionId) } : {}),
			};

			return isCurrentItem(result) ? [] : [result];
		});
	}
	catch (error) {
		if (currentRequest === requestId && !controller.signal.aborted) {
			results.value = [];
			unexpectedError(error);
		}
	}
	finally {
		if (currentRequest === requestId) loading.value = false;
		if (activeController === controller) activeController = undefined;
	}
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

		const failure = settled.find(
			(result): result is PromiseRejectedResult => result.status === 'rejected',
		);
		if (failure) unexpectedError(failure.reason);

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
				<render-template :collection="props.collection" :item="item.item" :template="displayTemplate" />
			</Item>
		</Group>
		<Empty :show="showHint">
			Type to search {{ collectionName }}
		</Empty>
		<Empty :show="isEmpty" />
		<Group v-if="results.length > 0" force-mount>
			<Item
				v-for="result in results"
				:key="itemValue(result)"
				:value="itemValue(result)"
				:icon="collectionIcon"
				force-mount
				@select="selectItem(result)"
			>
				<render-template :collection="props.collection" :item="result.item" :template="displayTemplate" />
				<template v-if="descriptionField && result.item[descriptionField]" #description>
					<Highlights :text="String(result.item[descriptionField])" :query="search" />
				</template>
			</Item>
		</Group>
	</List>
</template>
