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
	padding: 4px;
}

.command-footer {
	--v-icon-size: 18px;
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	justify-content: end;
	gap: 12px;
	padding: 8px 12px;
	color: var(--theme--foreground-subdued);
	border-top: solid 1px var(--theme--border-color);

	:deep([data-icon='sync_alt']) {
		transform: rotate(90deg);
	}

	& > span {
		display: flex;
		align-items: center;
		gap: 6px;
	}
}
</style>
