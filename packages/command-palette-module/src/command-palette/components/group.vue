<script setup lang="ts">
import { ListboxGroup, ListboxGroupLabel } from 'reka-ui';
import GroupHeading from './group-heading.vue';

defineProps<{
	heading?: string;
	icon?: string;
}>();
</script>

<template>
	<ListboxGroup>
		<ListboxGroupLabel as-child>
			<GroupHeading>
				<v-icon v-if="icon" :name="icon" />
				{{ heading }}
			</GroupHeading>
		</ListboxGroupLabel>
		<slot />
	</ListboxGroup>
</template>
