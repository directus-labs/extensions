<script setup lang="ts">
import type { Component as ComponentType } from 'vue';
import { CommandItem } from '../../primitives/cmdk';

withDefaults(
	defineProps<{
		icon?: string;
		value?: string;
		keywords?: string[];
		forceMount?: boolean;
		as: ComponentType;
	}>(),
	{
		as: () => CommandItem,
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
		:keywords="keywords"
		:force-mount="forceMount"
		@select="$emit('select')"
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
	padding: 6px 12px 6px 8px;
	border-radius: 6px;
	min-height: 40px;

	&[data-selected='true'] {
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
		margin-right: 12px;
		width: 24px;
		height: 24px;
	}

	.content {
		flex: 1;
	}

	.title {
		color: var(--theme--foreground);
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
