<script setup lang="ts">
import { useStores } from "@directus/extensions-sdk";
import { groupBy } from "lodash-es";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import CommandItem from "./components/command-item.vue";
import Group from "./components/group.vue";
import Empty from "./components/empty.vue";
import List from "./components/list.vue";
import { useCommandContext } from "./composables/use-global-command-state";
import { useRecentCommands } from "./composables/use-recent-commands";
import RecentItems from "./recents/recent-items.vue";
import { CommandConfig, useRegisteredCommands } from "./registry";
import { useCommandRouter } from "./router/router";

const stores = useStores();
const route = useRoute();
const router = useRouter();
const context = useCommandContext();
const i18n = useI18n();
const commandRouter = useCommandRouter();

const commandContext = computed(() => ({
  route,
  search: context.search.value,
  stores,
  i18n,
}));

const { search, clearSearch } = context;

const { add: addToRecents } = useRecentCommands();

const { groups, commands } = useRegisteredCommands(commandContext);

const ungrouped = Symbol();
const groupIdsSet = computed(() => new Set(groups.value.map(({ id }) => id)));

const groupedCommands = computed(
  () =>
    groupBy(commands.value, ({ group }) =>
      groupIdsSet.value.has(group) ? group ?? ungrouped : ungrouped,
    ) as unknown as Record<string | symbol, typeof commands.value>,
);

const groupsWithCommands = computed(() =>
  groups.value.filter(({ id }) => groupedCommands.value[id]),
);

async function onSelect(command: CommandConfig) {
  addToRecents(command.id);

  if (command.action) {
    const result = await command.action({ router });

    if (result !== false) {
      context.close();
    }
  } else if (command.component) {
    commandRouter.push({ component: command.component, props: command.props });
    clearSearch();
  }
}
</script>

<template>
  <List>
    <Empty />
    <RecentItems
      v-if="!search"
      :available-commands="commands"
      :groups="groups"
      @select="onSelect(commands.find((c) => c.id === $event))"
    />
    <Group
      v-for="group in groupsWithCommands"
      :key="group.id"
      :heading="group.name"
    >
      <CommandItem
        v-for="(command, index) in groupedCommands[group.id]"
        :key="command.id"
        :command="command"
        :sort="index"
        @select="onSelect(command)"
      />
    </Group>
    <CommandItem
      v-for="command in groupedCommands[ungrouped]"
      :key="command.id"
      :command="command"
      :sort="index"
      @select="onSelect(command)"
    />
  </List>
</template>
