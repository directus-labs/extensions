<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import { onKeyDown, useEventListener } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useSettings } from '../composables/use-settings';
import { OPEN_COMMAND_PALETTE_EVENT, OPEN_SEARCH_EVENT } from '../constants';
import { isModuleEnabled } from '../utils/is-module-enabled';
import CommandPalette from './command-palette.vue';

const stores = useStores();
const settings = useSettings(stores);
const active = ref(false);
const moduleEnabled = computed(() => isModuleEnabled(stores));

const paletteEnabled = computed(
	() => moduleEnabled.value && settings.settings.value?.commandPaletteEnabled !== false,
);

onKeyDown('k', (event) => {
	if (!paletteEnabled.value) return;

	if (
		event.target instanceof HTMLElement
		&& event.target.closest('input, textarea, [contenteditable="true"], .cm-editor')
	) {
		return;
	}

	if (!event.metaKey && !event.ctrlKey) return;

	event.preventDefault();
	event.stopPropagation();
	active.value = !active.value;
});

onKeyDown('Escape', () => {
	active.value = false;
});

useEventListener(window, OPEN_SEARCH_EVENT, open);
useEventListener(window, OPEN_COMMAND_PALETTE_EVENT, open);

function open() {
	if (paletteEnabled.value) active.value = true;
}
</script>

<template>
	<v-error-boundary>
		<CommandPalette v-model:active="active" />
	</v-error-boundary>
</template>
