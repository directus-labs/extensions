<script setup lang="ts">
import type { Settings } from '@directus/types';
import { useStores } from '@directus/extensions-sdk';
import { onKeyDown, useEventListener } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useSettings } from '../composables/use-settings';
import { OPEN_SEARCH_EVENT } from '../constants';
import CommandPalette from './command-palette.vue';

const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const settings = useSettings();

const active = ref(false);

const moduleEnabled = computed(
	() =>
		(settingsStore.settings as Settings).module_bar.find(
			(module) => module.type === 'module' && module.id === 'global-search',
		)?.enabled,
);

onKeyDown('k', (e) => {
	if (!moduleEnabled.value)
		return;
	if (settings.settings.value?.commandPaletteEnabled === false)
		return;

	if (e.metaKey || e.ctrlKey) {
		e.preventDefault();
		e.stopPropagation();
		toggle();
	}
});

onKeyDown('Escape', () => {
	active.value = false;
});

useEventListener(OPEN_SEARCH_EVENT, () => {
	active.value = true;
});

function toggle() {
	active.value = !active.value;
}
</script>

<template>
	<v-error-boundary>
		<CommandPalette v-model:active="active" />
	</v-error-boundary>
</template>
