<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, watchEffect } from 'vue';
import { useWS } from '../../interface/composables/use-ws';
import { MODULE_ID } from '../../shared/constants';
import { useSettings } from '../utils/use-settings';
import RealtimeCollaborationController from './realtime-collaboration-controller.vue';

const { useSettingsStore, useAppStore } = useStores();
const settingsStore = useSettingsStore();
const { enabledGlobally } = useSettings();

const moduleEnabled = computed(
	() =>
		(settingsStore.settings as Settings)?.module_bar?.find(
			(module) => module.type === 'module' && module.id === MODULE_ID,
		)?.enabled,
);

const appStore = useAppStore();

const unwatch = watchEffect(() => {
	const authenticated = appStore.authenticated;

	let ws = useWS();

	if (authenticated === false) {
		ws.disconnect();
		unwatch();
	}
});
</script>

<template>
	<v-error-boundary>
		<RealtimeCollaborationController v-if="moduleEnabled" :enabledGlobally="enabledGlobally" />
	</v-error-boundary>
</template>
