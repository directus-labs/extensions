<script setup lang="ts">
import type { CommandAvailableContext, CommandConfig } from './registry';
import { useApi, useStores } from '@directus/extensions-sdk';
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useGlobalSearch } from '../composables/use-global-search';
import { useUnexpectedError } from '../composables/use-unexpected-error';
import { getItemRoute } from '../utils/get-item-route';
import { isItemRouteAvailable } from '../utils/is-item-route-available';
import CommandItem from './components/command-item.vue';
import Empty from './components/empty.vue';
import Group from './components/group.vue';
import Item from './components/item.vue';
import List from './components/list.vue';
import { useAskAi } from './composables/use-ask-ai';
import { useCommandContext } from './composables/use-global-command-state';
import { useRecentCommands } from './composables/use-recent-commands';
import SearchResults from './content-search/search-results.vue';
import RecentItems from './recents/recent-items.vue';
import { useRegisteredCommands } from './registry';
import { useCommandRouter } from './router/router';
import { rankItems } from './utils/rank-items';

const stores = useStores();
const router = useRouter();
const context = useCommandContext();
const i18n = useI18n();
const api = useApi();
const commandRouter = useCommandRouter();
const unexpectedError = useUnexpectedError({ stores, i18n });

const commandContext = computed<CommandAvailableContext>(() => ({
	route: router.currentRoute.value,
	stores,
	i18n,
	api,
}));

const { search, clearSearch } = context;
const currentUserId = stores.useUserStore().currentUser?.id;
const { commands: recentCommandIds, add: addToRecents } = useRecentCommands(currentUserId);
const collectionsStore = stores.useCollectionsStore();
const globalSearch = useGlobalSearch({
	query: search,
	globallyAvailableOnly: true,
	minimumQueryLength: 2,
	searchAsYouType: true,
});
const hasGlobalSearchResults = computed(() => globalSearch.results.value.length > 0);

// Sync so the reset in useGlobalSearch's unmount hook still lands when a sub-view replaces this one mid-search.
watch(globalSearch.loading, (loading) => {
	context.loading.value = loading;
}, { immediate: true, flush: 'sync' });

const { groups, commands } = useRegisteredCommands(commandContext);

const rankedCommands = computed(() =>
	rankItems(commands.value, search.value, (command) => ({
		value: command.id,
		keywords: [command.name, command.description ?? '', ...(command.keywords ?? [])],
		priority: command.priority,
	})),
);

const positionedCommands = computed(() => {
	const groupIds = new Set(groups.value.map(({ id }) => id));
	const grouped: Record<string, CommandConfig[]> = {};
	const groupScores = new Map<string, number>();
	const ungrouped: CommandConfig[] = [];

	for (const { item: command, score } of rankedCommands.value) {
		if (!command.group || !groupIds.has(command.group)) {
			ungrouped.push(command);
			continue;
		}

		(grouped[command.group] ??= []).push(command);
		if (!groupScores.has(command.group)) groupScores.set(command.group, score);
	}

	return { grouped, groupScores, ungrouped };
});

// Groups follow their best match, so the strongest results stay on top.
const groupsWithCommands = computed(() => {
	const { groupScores } = positionedCommands.value;

	return groups.value
		.filter(({ id }) => groupScores.has(id))
		.sort((a, b) => groupScores.get(b.id)! - groupScores.get(a.id)!);
});

const { visible: showAskAi, askAi } = useAskAi();

// Loading covers the debounce too, so content hits don't flash "No results found" before they arrive.
const isEmpty = computed(() =>
	rankedCommands.value.length === 0
	&& !hasGlobalSearchResults.value
	&& !globalSearch.loading.value
	&& !showAskAi.value,
);

function navigateToItem(item: { collection: string; pk: string }) {
	const singleton = collectionsStore.getCollection(item.collection)?.meta?.singleton === true;
	const route = getItemRoute(item.collection, item.pk, singleton ? { singleton } : undefined);
	if (!isItemRouteAvailable(router, route)) return;

	router.push(route);
	context.close();
}

function selectRecentCommand(commandId: string) {
	const command = commands.value.find(({ id }) => id === commandId);
	if (command) void onSelect(command);
}

async function onSelect(command: CommandConfig) {
	addToRecents(command.id);

	if (command.action) {
		try {
			const result = await command.action({ router });

			if (result !== false) {
				context.close();
			}
		}
		catch (error) {
			unexpectedError(error);
		}
	}
	else if (command.component) {
		commandRouter.push({ component: command.component, props: command.props });
		clearSearch();
	}
}
</script>

<template>
	<List>
		<Empty v-if="isEmpty" />
		<RecentItems
			v-if="!search"
			:available-commands="commands"
			:command-ids="recentCommandIds"
			:groups="groups"
			@select="selectRecentCommand"
		/>
		<SearchResults
			v-if="search && hasGlobalSearchResults"
			:results="globalSearch.results.value"
			:query="search"
			@select="navigateToItem"
		/>
		<CommandItem
			v-for="command in positionedCommands.ungrouped"
			:key="command.id"
			:command="command"
			@select="onSelect(command)"
		/>
		<Group
			v-for="group in groupsWithCommands"
			:key="group.id"
			:heading="group.name"
			:icon="group.icon"
		>
			<CommandItem
				v-for="command in positionedCommands.grouped[group.id]"
				:key="command.id"
				:command="command"
				icon-placement="start"
				@select="onSelect(command)"
			/>
		</Group>
		<Group v-if="showAskAi" heading="AI Assistant">
			<Item value="$ask-ai" icon="auto_awesome" @select="askAi">
				Ask AI: {{ search.trim() }}
			</Item>
		</Group>
	</List>
</template>
