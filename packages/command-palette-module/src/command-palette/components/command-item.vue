<script setup lang="ts">
import type { CommandConfig } from '../registry';
import { assignWith, isUndefined, omit } from 'lodash-es';
import { computed } from 'vue';
import Item from './item.vue';

const props = defineProps<
	{
		command: CommandConfig;
		forceMount?: boolean;
		sort?: number;
	} & Partial<CommandConfig>
>();

defineEmits<{
	select: [];
}>();

// Allow for prop overrides
const command = computed(() =>
	assignWith(props.command, omit(props, 'command'), (obj, src) =>
		isUndefined(src) ? obj : src),
);

const RenderedCommand = computed(() => command.value.render);
const RenderIcon = computed(() => command.value.icon);
</script>

<template>
	<Item
		:value="command.id"
		:keywords="[
			command.name ?? '',
			command.description ?? '',
			...(command.keywords ?? []),
		]"
		:force-mount="forceMount"
		:data-sort="sort"
		@select="$emit('select')"
	>
		<template #icon>
			<v-icon v-if="typeof command.icon === 'string'" :name="command.icon" />
			<RenderIcon v-else />
		</template>
		<template #description>
			<slot name="description">
				{{ command.description }}
			</slot>
		</template>
		<slot>
			<RenderedCommand v-if="command.render" />
			<div v-else v-md="command.name" />
		</slot>
	</Item>
</template>
