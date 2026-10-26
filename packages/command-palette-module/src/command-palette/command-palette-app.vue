<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import { onKeyDown, useEventListener } from '@vueuse/core';
import { computed, ref } from 'vue';
import { useSettings } from '../composables/use-settings';
import { OPEN_SEARCH_EVENT } from '../constants';
import { isMacOS } from '../utils/is-mac-os';
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

	// Leave Cmd/Ctrl+K to rich editors for links. The markdown editor (CodeMirror 5) and the v12 WYSIWYG
	// (Tiptap) are contenteditable; the v11 WYSIWYG (TinyMCE) runs in an iframe, so its keys never reach us.
	if (event.target instanceof HTMLElement && event.target.closest('[contenteditable="true"]')) return;

	// Ctrl+K is "delete to end of line" in macOS text fields.
	if (!(isMacOS() ? event.metaKey : event.ctrlKey)) return;

	event.preventDefault();
	event.stopPropagation();
	active.value = !active.value;
});

onKeyDown('Escape', () => {
	active.value = false;
});

useEventListener(window, OPEN_SEARCH_EVENT, open);

function open() {
	if (paletteEnabled.value) active.value = true;
}
</script>

<template>
	<v-error-boundary>
		<CommandPalette v-model:active="active" />
	</v-error-boundary>
</template>
