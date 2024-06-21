<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import CollectionResults from './components/collection-results.vue';

import SearchNavigation from './components/navigation.vue';
import RecentSearches from './components/recent-searches.vue';
import { useGlobalSearch } from './composables/use-global-search';
import { useIsAdmin } from './composables/use-is-admin';

const { t } = useI18n();

const isAdmin = useIsAdmin();
const { query, results, settingsValid, settings, search, clear, collections, info, loading  } = useGlobalSearch({
  syncWithQuery: true
});
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
			<header v-if="settingsValid">
				<form class="search-form" @submit.prevent="search(query)">
					<v-input v-model="query" :placeholder="t('search')" autofocus :disabled="!settings">
						<template #prepend>
							<v-icon name="search" />
						</template>
						<template #append>
							<v-progress-circular v-if="loading" indeterminate />
							<v-icon v-else-if="query" name="close" clickable @click="clear()" />
						</template>
					</v-input>
					<v-button v-if="settings.searchMode === 'form_submit'" type="submit">Search</v-button>
				</form>
				<div class="search-info">
					<p v-show="query">
						{{ info.hits }} results returned in {{ info.time }}ms for "{{ info.query }}" across
						{{ collections.length }} collections.
					</p>
				</div>
			</header>

			<!-- No Config -->
			<section v-if="!settingsValid">
				<v-info title="Search Configuration Error" icon="warning" type="danger" center>
					<p>The search configuration is invalid.</p>
					<template v-if="!isAdmin">
						<p>Please configure the global search settings.</p>
						<v-button :to="{ name: 'global-search-settings' }" style="margin-top: 12px" secondary>Edit Global Search Settings</v-button>
					</template>
					<p v-else>Please contact an admin to properly configure the global search.</p>
				</v-info>
			</section>

			<!-- Search Results -->
			<section v-if="settingsValid && query" class="search-results">
				<p class="text">Results</p>
					<v-list v-if="results.length > 0" class="search-results-list">
						<template v-for="{ collection, hits, displayTemplate, descriptionField } in results" :key="collection">
							<collection-results
								v-if="hits.length > 0"
								:collection="collection"
								:hits="hits"
								:query="query"
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
							query = value.query;
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
