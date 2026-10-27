<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import { watchDebounced } from '@vueuse/core';
import { computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import CollectionResults from './components/collection-results.vue';
import SearchNavigation from './components/navigation.vue';
import RecentSearches from './components/recent-searches.vue';
import { useGlobalSearch } from './composables/use-global-search';
import { useRecentSearches } from './composables/use-recent-searches';
import { isAdminFromStores } from './utils/is-admin';

const { t } = useI18n();
const stores = useStores();
const isAdmin = computed(() => isAdminFromStores(stores));
const currentUserId = stores.useUserStore().currentUser?.id;
const recentSearches = useRecentSearches(currentUserId);

const {
	query,
	results,
	settingsValid,
	settings,
	search,
	clear,
	collections,
	completedSearch,
	info,
	loading,
} = useGlobalSearch({
	syncWithQuery: true,
});

// Only keep a search once typing settles, so as-you-type doesn't save every prefix.
watchDebounced(completedSearch, (completed) => {
	if (completed) recentSearches.add(completed.query);
}, { debounce: 1000 });

async function selectRecentSearch(value: string) {
	query.value = value;
	if (settings.value?.searchMode !== 'on_submit') return;

	// Let the query watcher run first; it cancels any request started before it.
	await nextTick();
	void search(value);
}
</script>

<template>
	<private-view title="Search" icon="search">
		<!-- Header icon fallback for hosts before 11.14, which lack the icon prop -->
		<template #title-outer:prepend>
			<v-button class="header-icon" rounded disabled icon secondary>
				<v-icon name="search" />
			</v-button>
		</template>

		<!-- Navigation -->
		<template #navigation>
			<SearchNavigation />
		</template>

		<!-- Main Content -->
		<main class="container">
			<!-- Search Input -->
			<header v-if="settingsValid">
				<form class="search-form" @submit.prevent="search(query)">
					<v-input
						v-model="query"
						:placeholder="t('search')"
						autofocus
						:disabled="!settings"
					>
						<template #prepend>
							<v-icon name="search" />
						</template>
						<template #append>
							<v-progress-circular v-if="loading" indeterminate />
							<v-icon
								v-else-if="query"
								name="close"
								clickable
								@click="clear()"
							/>
						</template>
					</v-input>
					<v-button v-if="settings?.searchMode === 'on_submit'" type="submit">
						Search
					</v-button>
				</form>
				<div class="search-info">
					<p v-show="query">
						{{ info.hits }} {{ info.hits === 1 ? 'result' : 'results' }} returned in {{ info.time }}ms for "{{
							info.query
						}}" across {{ collections.length }} {{ collections.length === 1 ? 'collection' : 'collections' }}.
					</p>
				</div>
			</header>

			<!-- No Config -->
			<section v-if="!settingsValid">
				<v-info
					title="Search Configuration Error"
					icon="warning"
					type="danger"
					center
				>
					<p>The search configuration is invalid.</p>
					<template v-if="isAdmin">
						<p>Please configure the command palette settings.</p>
						<v-button
							:to="{ name: 'global-search-settings' }"
							style="margin-top: 12px"
							secondary
						>
							Edit Settings
						</v-button>
					</template>
					<p v-else>
						Please contact an admin to properly configure the command palette.
					</p>
				</v-info>
			</section>

			<section
				v-if="settingsValid && !query && recentSearches.searches.value.length > 0"
				class="recent-searches"
			>
				<p class="text">
					Recent Searches
				</p>
				<RecentSearches
					:searches="recentSearches.searches.value"
					@select="selectRecentSearch"
					@clear="recentSearches.clear"
				/>
			</section>

			<!-- Search Results -->
			<section v-if="settingsValid && query" class="search-results">
				<p class="text">
					Results
				</p>
				<v-list v-if="results.length > 0" class="search-results-list">
					<template
						v-for="{
							collection,
							hits,
							displayTemplate,
							descriptionField,
							descriptionDisplay,
						} in results"
						:key="collection"
					>
						<CollectionResults
							v-if="hits.length > 0"
							:collection="collection"
							:hits="hits"
							:query="query ?? ''"
							:display-template="displayTemplate"
							:description-field="descriptionField"
							:description-display="descriptionDisplay"
						/>
					</template>
				</v-list>
				<!-- No results found -->
				<template v-else-if="loading">
					<v-list>
						<VSkeletonLoader
							v-for="i in [1, 2, 3]"
							:key="i"
							style="margin-top: 8px !important"
						/>
					</v-list>
				</template>
				<template v-else>
					<v-info title="No Results Found" icon="block">
						Please try a different search query.
					</v-info>
				</template>
			</section>
		</main>

		<!-- Sidebar -->
		<template #sidebar>
			<sidebar-detail id="info" icon="info" title="Information" close>
				<div
					v-md="
						`**Global Search** –– \n Search for keywords across many different collections and fields.\n\nRecent searches are stored locally for the current Directus project and user.`
					"
					class="page-description"
				/>
			</sidebar-detail>
		</template>
	</private-view>
</template>

<style scoped>
.container {
	padding: var(--content-padding);
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
	font-size: 12px;
	color: var(--theme--foreground-subdued);
	height: 48px;
	overflow-y: hidden;
	text-overflow: ellipsis;
}

.search-results-list > * {
	margin-bottom: var(--content-padding);
}
</style>
