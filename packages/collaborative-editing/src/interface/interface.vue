<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { useAvatarStack } from './composables/use-avatar-stack';
import { type DirectusProvider, useYJS } from './composables/use-yjs';

const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const settings = useSettings();

const collaborativeEditingEnabled = computed(() => {
	const moduleEnabled = (settingsStore.settings as Settings).module_bar.find(
		(module) => module.type === 'module' && module.id === 'collab-module',
	)?.enabled;
	const enabled = settings.settings.value?.collaborativeEditingEnabled;
	return moduleEnabled && enabled;
});

watch(collaborativeEditingEnabled, (value) => {
	console.log('collaborativeEditingEnabled', value);
});

interface FieldValue {
	field: string;
	value: unknown;
}

const emit = defineEmits<{
	setFieldValue: [FieldValue];
}>();

let provider: DirectusProvider;
const { add } = useAvatarStack();

onMounted(() => {
	if (!collaborativeEditingEnabled.value) {
		return;
	}
	provider = useYJS({
		onFieldChange(field, value) {
			emit('setFieldValue', { field, value });
		},
	});

	provider.on('connected', () => {
		connectionStatus.value = 'connected';
	});

	provider.on('debug', (...data) => {
		console.dir(data, { depth: null });
	});

	provider.on('user:connect', (user) => {
		add(user);
	});
});

onUnmounted(() => {
	provider.disconnect();
});

const connectionStatus = ref<string>('initializing');
</script>

<template>
	<div v-if="collaborativeEditingEnabled" class="collaborative-interface">
		<div v-if="connectionStatus !== 'connected'" class="connection-status">
			Collaboration status: {{ connectionStatus }}
		</div>
		<slot />
	</div>
</template>

<style scoped>
.collaborative-interface {
	position: relative;
}

.connection-status {
	position: fixed;
	bottom: 10px;
	right: 10px;
	background: rgba(255, 0, 0, 0.7);
	color: white;
	padding: 5px 10px;
	border-radius: 4px;
	font-size: 12px;
	z-index: 9999;
}
</style>
