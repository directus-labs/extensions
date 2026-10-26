<script setup lang="ts">
import type { Component as ComponentType } from 'vue';
import { ListboxItem } from 'reka-ui';

withDefaults(
	defineProps<{
		icon?: string;
		value?: string;
		as?: ComponentType | string;
	}>(),
	{
		as: () => ListboxItem,
	},
);

defineEmits<{
	select: [];
}>();
</script>

<template>
	<component
		:is="as"
		class="result-item"
		:value="value"
		@select.prevent="$emit('select')"
	>
		<span class="icon">
			<slot name="icon">
				<v-icon v-if="icon" :name="icon" />
			</slot>
		</span>
		<div class="content">
			<div class="title">
				<slot />
			</div>
			<div class="description">
				<slot name="description" />
			</div>
		</div>
	</component>
</template>

<style scoped lang="scss">
.result-item {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	padding: 0.1875rem 0.75rem 0.1875rem 0.5rem;
	border-radius: 0.375rem;
	min-block-size: 2.125rem;
	cursor: pointer;

	&[data-highlighted] {
		background-color: var(--theme--background-subdued);
		--v-icon-color: var(--theme--foreground);

		.title {
			color: var(--theme--foreground-accent);
		}

		.description {
			color: var(--theme--foreground);
		}
	}

	.icon {
		--v-icon-size: 1.25rem;

		display: flex;
		flex: 0 0 1.25rem;
		align-items: center;
		justify-content: center;
		margin-inline-end: 0.625rem;
		inline-size: 1.25rem;
		block-size: 1.25rem;
	}

	.content {
		flex: 1;
		min-inline-size: 0;
	}

	.title {
		color: var(--theme--foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.description {
		color: var(--theme--foreground-subdued);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 1;
	}
}
</style>
