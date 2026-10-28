<script setup lang="ts">
import Item from './item.vue';

// Without the explicit undefined default, Vue casts a missing boolean prop to false.
withDefaults(defineProps<{
	show?: boolean;
}>(), {
	show: undefined,
});
</script>

<template>
	<Item v-if="show === undefined" as="div" icon="search">
		<slot>No results found</slot>
	</Item>
	<div v-else-if="show" class="empty-state">
		<v-icon name="search" />
		<span><slot>No results found</slot></span>
	</div>
</template>

<style scoped lang="scss">
.empty-state {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	gap: 0.625rem;
	padding: 0.5rem 0.75rem;
	color: var(--theme--foreground-subdued);
}
</style>
