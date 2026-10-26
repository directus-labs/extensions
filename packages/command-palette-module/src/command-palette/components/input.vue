<script setup lang="ts">
import { ListboxFilter } from 'reka-ui';

defineProps<{
	listId: string;
	loading?: boolean;
	placeholder?: string;
	showBack?: boolean;
}>();

defineEmits<{
	back: [];
}>();

const search = defineModel<string>({ default: '' });

// Reka only checks its own composition flag. Safari sends the Enter that ends an IME composition
// after compositionend, as keyCode 229, so stop it before Reka selects an item.
function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) event.stopPropagation();
}
</script>

<template>
	<div class="search-input" @keydown.capture="onKeydown">
		<span v-if="showBack" class="back" @click="$emit('back')">
			<v-icon name="keyboard_backspace" />
		</span>
		<span v-else class="back-placeholder" />
		<ListboxFilter
			v-model="search"
			:placeholder="placeholder"
			auto-focus
			role="combobox"
			aria-label="Command Menu"
			aria-autocomplete="list"
			aria-expanded="true"
			:aria-controls="listId"
			autocomplete="off"
			autocorrect="off"
			spellcheck="false"
		/>
		<v-progress-circular v-if="loading === true" indeterminate />
		<v-icon v-else-if="search" clickable name="close" @click="search = ''" />
	</div>
</template>

<style scoped lang="scss">
.search-input {
	display: flex;
	position: relative;
	align-items: center;
	padding: 0.5rem 0.75rem;
	block-size: 3.375rem;
	border-block-end: 0.0625rem solid var(--theme--primary);

	.back,
	.back-placeholder {
		margin-inline-end: 0.625rem;
	}

	.back {
		--v-icon-size: 1.125rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.1875rem;
		background: var(--theme--background-normal);
		border-radius: 0.25rem;
		cursor: pointer;
	}

	input {
		flex: 1;
		background-color: transparent;
		border: none;
		color: var(--theme--foreground);
		outline: none;
		padding: 1.25rem 1.25rem 1.25rem 0;
		margin: 0;
		inline-size: 100%;
		block-size: 100%;
		line-height: 3rem;
		font-size: var(--global-search--search-bar-font-size, 1.125rem);
	}

	.v-progress-circular {
		position: absolute;
		inset-inline-end: 0.75rem;
	}
}
</style>
