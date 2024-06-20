<script setup lang="ts">
import { getFieldsFromTemplate, useApi, useStores, useCollection } from '@directus/extensions-sdk';
import { mergeFilters } from '@directus/utils';
import { Ref, ref, unref, watch, computed, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDebounceFn, useStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';

import { SearchConfig, SearchHistoryItem, type SearchResult } from './types';
import { createDeepObject } from './utils/create-deep-object';

import SearchNavigation from './components/navigation.vue';
import CollectionResults from './components/collection-results.vue';
import RecentSearches from './components/recent-searches.vue';

const { t } = useI18n();
const { useSettingsStore } = useStores();
const router = useRouter();
const route = useRoute();
const api = useApi();
const settingsStore = useSettingsStore();
const searchHistory = useStorage('search-history', []) as Ref<SearchHistoryItem[]>;

// Retrieve config from directus_settings collection
const globalSearchSettings = computed(() => {
    const result = SearchConfig.safeParse(settingsStore.settings.global_search_settings as SearchConfig);
	if (result.success) {
		return result.data;
	}
	return null;
});

const collectionsToSearch = computed(() => {
	return unref(globalSearchSettings)?.collections ?? [];
});

const isConfigValid = computed(() => {
    // Check if the global search settings exist and the collections to search are valid
    return !!globalSearchSettings.value && collectionsToSearch.value.length > 0;
});

// If there's a query for search in the url, set it as the searchValue
const searchValue: Ref<string | null> = ref((route.query?.search as string) ?? null);

// If remember_last_search is enabled, set the last search value to the searchValue from the storage
if (globalSearchSettings.value?.rememberLastSearch) {
	searchValue.value = searchHistory.value[0]?.query ?? null;
}

const results: Ref<SearchResult[]> = ref([]);
const loading = ref(false);
const collectionPrimaryKeys: Ref<{ [key: string]: string }> = ref({});

const searchInfo = reactive({
	isSearching: false,
	query: '',
	hits: 0,
	time: 0,
});

function getPrimaryKeys() {
	const primaryKeys: { [key: string]: string } = {};
	for (const { collection } of unref(collectionsToSearch)) {
		const { primaryKeyField } = useCollection(collection);
		primaryKeys[collection] = primaryKeyField.value?.field as string;
	}
	return primaryKeys;
}

const debouncedSearch = useDebounceFn(
	() => {
		if (searchValue.value) {
			search(searchValue.value);
		}
	},
	unref(globalSearchSettings)?.triggerRate ?? 500,
);

async function search(value: string) {
	try {
		// Initial search state so we don't show any results before a user has searched
		searchInfo.isSearching = true;
		searchInfo.query = value;

		loading.value = true;
		results.value = [];

		// Set the searchValue in the url for history purposes, but use replace to avoid adding a million entries to the history
		router.replace({ query: { search: value } });

		// We're tracking the time it takes to search and the number of hits
		const startedAt = Date.now();
		let hits = 0;

		// Add a delay to simulate a slow search
		// await new Promise((resolve) => setTimeout(resolve, 1000));

		const searchPromises = unref(collectionsToSearch).map(async (index) => {
			const { collection, displayTemplate, descriptionField, fields, filter, sort, limit } = index;

			const displayFields = getFieldsFromTemplate(displayTemplate);
			const primaryKeyField = unref(collectionPrimaryKeys)[collection] || 'id';

			// Use the mergeFilters utility to combine the existing query filter with the search filter
			const paramsFilter = mergeFilters(filter, {
				_or: fields.map((field) =>
					createDeepObject(field, {
						_icontains: unref(searchValue),
					}),
				),
			});

			const params = {
				limit: limit || 5,
				sort: sort || [primaryKeyField],
				filter: paramsFilter,
				fields: [primaryKeyField, descriptionField].concat(displayFields),
			};

			// Update the url if the collection is a directus system collection
			const url = collection.startsWith('directus_') ? collection.replace('directus_', '') : `/items/${collection}`;

			const { data } = await api.get(url, { params });

			// If there are results, push them to the results array.
			if (data.data.length > 0) {
				results.value.push({
					collection,
					hits: data.data,
					displayTemplate,
					descriptionField,
				});
			}

			hits += data.data.length;
		});

		// Wait for all searchPromises to resolve
		await Promise.allSettled(searchPromises);

		// Add additional context for the user about the search
		searchInfo.hits = hits;
		searchInfo.time = Date.now() - startedAt;
		loading.value = false;

		// Update the search history
		updateSearchHistory(value, unref(results));
	} catch (error) {
		console.error(error);
		loading.value = false;
	}
}

function clear() {
	searchValue.value = null;
	searchInfo.isSearching = false;
	searchInfo.query = '';
	results.value = [];
	router.replace({ query: {} });
}

// If there's a search query in the url, go ahead and search immediately.
if (searchValue.value) {
	search(searchValue.value);
}

// **Watchers**
watch(searchValue, (value) => {
	if (!value) {
		clear();
	} else if (unref(globalSearchSettings)?.searchMode === 'as_you_type') {
		debouncedSearch();
	}
});

watch(
	globalSearchSettings,
	(value) => {
		if (value) {
			// If the config is loaded, set the primary keys for each collection
			collectionPrimaryKeys.value = getPrimaryKeys();
		}
	},
	{ immediate: true },
);

function updateSearchHistory(value: string, results: SearchResult[]) {
	if (results.length > 0) {
		const currentTime = Date.now();
		const existingQuery = searchHistory.value.find((item) => item.query === value);
		const recentSearchLimit = unref(globalSearchSettings)?.recentSearchLimit ?? 5;

		if (existingQuery) {
			existingQuery.timestamp = currentTime;
		} else {
			// Ensure the search history does not exceed the recentSearchLimit before adding a new query
			if (unref(searchHistory).length >= recentSearchLimit) {
				// Sort the search history by timestamp (oldest first) and remove the oldest entry
				unref(searchHistory).sort((a, b) => a.timestamp - b.timestamp);
				unref(searchHistory).shift();
			}
			// Add the new query to the search history
			searchHistory.value.push({ query: value, timestamp: currentTime });
		}
	}
}
</script>

<template>
	<private-view title="Search">
		<!-- Header Icon -->
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="search" />
			</v-button>
		</template>

		<!-- Navigation -->
		<template #navigation>
			<search-navigation />
		</template>

		<template #headline>
			<v-breadcrumb :items="[{ name: 'Global Search', to: { name: 'global-search-index' } }]" />
		</template>

		<!-- Main Content -->
		<main class="container">
			<!-- Search Input -->
			<header v-if="isConfigValid">
				<form class="search-form" @submit.prevent="search(searchValue)">
					<v-input v-model="searchValue" :placeholder="t('search')" autofocus :disabled="!globalSearchSettings">
						<template #prepend>
							<v-icon name="search" />
						</template>
						<template #append>
							<v-progress-circular v-if="loading" indeterminate />
							<v-icon v-else-if="!loading && searchValue" name="close" clickable @click="clear()" />
						</template>
					</v-input>
					<v-button v-if="globalSearchSettings.searchMode === 'form_submit'" type="submit">Search</v-button>
				</form>
				<div class="search-info">
					<p v-show="!loading && searchInfo.isSearching">
						{{ searchInfo.hits }} results returned in {{ searchInfo.time }}ms for "{{ searchInfo.query }}" across
						{{ collectionsToSearch.length }} collections.
					</p>
				</div>
			</header>

			<!-- No Config -->
			<section v-if="!isConfigValid">
				<v-info title="Search Configuration Error" icon="warning" type="danger" center>
					<p>The search configuration is invalid.</p>
					<template v-if="!userStore?.currentUser?.role?.admin_access">
						<p>Please configure the global search settings.</p>
						<v-button :to="{ name: 'global-search-settings' }" style="margin-top: 12px" secondary>Edit Global Search Settings</v-button>
					</template>
					<p v-else>Please contact an admin to properly configure the global search.</p>
				</v-info>
			</section>

			<!-- Search Results -->
			<section v-if="isConfigValid && searchInfo.isSearching" class="search-results">
				<p class="text">Results</p>
				<Bounce>
					<v-list v-if="results.length > 0 && !loading" class="search-results-list">
						<template v-for="{ collection, hits, displayTemplate, descriptionField } in results" :key="collection">
							<collection-results
								v-if="hits.length > 0"
								:collection="collection"
								:hits="hits"
								:searchValue="searchValue"
								:displayTemplate="displayTemplate"
								:descriptionField="descriptionField"
							/>
						</template>
					</v-list>
					<!-- No results found -->
					<template v-else-if="loading">
						<v-list>
							<VSkeletonLoader v-for="i in [1, 2, 3]" :key="i" style="margin-top: 8px !important" />
						</v-list>
					</template>
					<template v-else>
						<v-info title="No Results Found" icon="block">Please try a different search query.</v-info>
					</template>
				</Bounce>
			</section>
		</main>

		<!-- Sidebar -->
		<template #sidebar>
			<sidebar-detail icon="info" title="Information" close>
				<div
					v-md="`**Global Search** –– \n Search for keywords across many different collections and fields.`"
					class="page-description"
				/>
			</sidebar-detail>
			<sidebar-detail icon="history" title="Recent Searches" start-open>
				<div
					v-md="`Recent searches are only stored locally on your browser and not in the database.`"
					class="page-description"
				/>
				<recent-searches
					@update-query="
						(value: SearchHistoryItem) => {
							searchValue = value.query;
						}
					"
				/>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.container {
	padding: var(--content-padding);
	padding-top: 0;
	width: 100%;
	max-width: 1024px;

	& > div + * {
		margin-bottom: var(--content-padding);
	}
}

.text {
	color: var(--theme--foreground-sub);
	font-weight: var(--theme--fonts--display--font-weight);
	font-family: var(--theme--fonts--display--font-family);
	font-style: normal;
}

.search-form {
	display: flex;
	align-items: center;
	gap: 8px;
}

.search-info {
	color: var(--theme--foreground-subdued);
	margin-top: 8px;
	height: 48px;
	overflow-y: hidden;
	text-overflow: ellipsis;
}

.search-results-list > * {
	margin-bottom: var(--content-padding);
}

.hit-title {
	font-size: 1.2rem;
}

.hit-description {
	color: var(--theme--foreground-subdued);
}
</style>
