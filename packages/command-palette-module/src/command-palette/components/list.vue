<script setup lang="ts">
import { ListboxContent } from 'reka-ui';
import { computed, useId } from 'vue';
import { useCommandContext } from '../composables/use-global-command-state';
import CommandInput from './input.vue';

withDefaults(
	defineProps<{
		searchBarPlaceholder?: string;
	}>(),
	{
		searchBarPlaceholder: 'Search...',
	},
);

const { loading, search, router } = useCommandContext();
const showBack = computed(() => router.stack.value.length > 1);
const listId = `command-palette-list-${useId()}`;
</script>

<template>
	<CommandInput
		v-model="search"
		:loading="loading"
		:placeholder="searchBarPlaceholder"
		:list-id="listId"
		:show-back="showBack"
		@back="router.pop()"
	/>
	<ListboxContent :id="listId" class="command-list" aria-label="Suggestions">
		<div class="command-list-viewport">
			<slot />
		</div>
	</ListboxContent>
	<div class="command-footer">
		<span>
			<v-icon name="sync_alt" />
			<span> Navigate </span>
		</span>
		<span>
			<v-icon name="keyboard_return" />
			<span> Select </span>
		</span>
		<span>
			<v-icon name="keyboard_backspace" />
			<span> Back </span>
		</span>
	</div>
</template>

<style scoped lang="scss">
.command-list {
	max-height: 50vh;
	overflow-y: scroll;
}

.command-list-viewport {
	padding: 0.25rem;
}

.command-footer {
	--v-icon-size: 1.125rem;
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	justify-content: end;
	gap: 0.75rem;
	padding: 0.5rem 0.75rem;
	color: var(--theme--foreground-subdued);
	border-block-start: solid 0.0625rem var(--theme--border-color);

	:deep([data-icon='sync_alt']) {
		transform: rotate(90deg);
	}

	& > span {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
}
</style>
