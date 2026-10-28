<script setup lang="ts">
import type { CommandConfig, GroupConfig } from '../registry';
import { computed } from 'vue';
import CommandGroup from '../components/group.vue';
import RecentItem from './recent-item.vue';

const props = defineProps<{
	availableCommands: CommandConfig[];
	commandIds: readonly string[];
	groups: GroupConfig[];
}>();

defineEmits<{
	select: [id: string];
}>();

const commands = computed(() =>
	props.commandIds
		.map((id) => props.availableCommands.find((command) => command.id === id))
		.filter((command): command is CommandConfig => command !== undefined),
);
</script>

<template>
	<CommandGroup v-if="commands.length > 0" heading="Recents">
		<RecentItem
			v-for="command in commands"
			:key="command.id"
			:command="command"
			:group="groups.find(({ id }) => id === command.group)"
			@select="$emit('select', command.id)"
		/>
	</CommandGroup>
</template>
