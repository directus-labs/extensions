<script setup lang="ts">
import { computed } from 'vue';
import { CommandList } from '../../primitives/cmdk';
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
</script>

<template>
	<CommandInput
		v-model="search"
		:loading="loading"
		:placeholder="searchBarPlaceholder"
		:show-back="showBack"
	/>
	<CommandList>
		<slot />
	</CommandList>
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
[cmdk-list] {
	max-height: 50vh;
	overflow-y: scroll;
	height: var(--cmdk-list-height);
	/* transition: height 100ms ease; */
}

:deep([cmdk-list-sizer]) {
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
