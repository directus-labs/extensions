<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed } from 'vue';
import { useSettings } from '../utils/use-settings';
import CollaborativeEditingController from './collaborative-editing-controller.vue';

const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const { enabledGlobally } = useSettings();

const moduleEnabled = computed(() => {
	const moduleEnabled = (settingsStore.settings as Settings).module_bar?.find(
		(module) => module.type === 'module' && module.id === 'collab-module',
	)?.enabled;
	return moduleEnabled;
});
</script>

<template>
	<v-error-boundary>
		<CollaborativeEditingController v-if="moduleEnabled" :enabledGlobally="enabledGlobally" />
	</v-error-boundary>
</template>
