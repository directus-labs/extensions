<script setup lang="ts">
import type { CommandConfig, GroupConfig } from '../registry';
import { computed } from 'vue';
import CommandGroup from '../components/group.vue';
import { useRecentCommands } from '../composables/use-recent-commands';
import RecentItem from './recent-item.vue';

const props = defineProps<{
	availableCommands: CommandConfig[];
	groups: GroupConfig[];
}>();

defineEmits<{
	select: [id: string];
}>();

const { commands: commandIds } = useRecentCommands();

const commands = computed(() =>
	commandIds.value
		.map((id) => props.availableCommands.find((cmd) => cmd.id === id))
		.filter(Boolean),
);
</script>

<template>
	<CommandGroup v-if="commands.length > 0" heading="Recents" force-mount>
		<RecentItem
			v-for="command in commands"
			:key="command.id"
			:command="command"
			:group="groups.find(({ id }) => id === command.group)"
			@select="$emit('select', command.id)"
		/>
	</CommandGroup>
</template>
