<script setup lang="ts">
import { ListboxGroup, ListboxGroupLabel } from 'reka-ui';
import GroupHeading from './group-heading.vue';

defineProps<{
	heading?: string;
}>();
</script>

<template>
	<ListboxGroup class="command-group" :class="{ titled: heading }">
		<ListboxGroupLabel v-if="heading" as-child>
			<GroupHeading>
				{{ heading }}
			</GroupHeading>
		</ListboxGroupLabel>
		<slot />
	</ListboxGroup>
</template>

<style scoped>
.command-group.titled:not(:first-child) {
	margin-block-start: 0.5rem;
}
</style>
