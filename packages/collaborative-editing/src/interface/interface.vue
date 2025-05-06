<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, onUnmounted, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { useActiveField } from './composables/use-active-field';
import { useCurrentUser } from './composables/use-current-user';
import { useDoc } from './composables/use-doc';
import { useAwarenessStore } from './stores/awarenessStore';
import type { ActiveField, AwarenessUser } from './types';
const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const settings = useSettings();
const awarenessStore = useAwarenessStore();
const currentUser = useCurrentUser();
useActiveField();

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

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

const isNew = computed(() => props.primaryKey === '+');
const room = computed(() => props.collection + ':' + props.primaryKey);

const provider = useDoc({
	onFieldChange(field, value) {
		emit('setFieldValue', { field, value });
	},
});

if (collaborativeEditingEnabled.value && !provider.connected.value) {
	provider.connect();
}

if (!isNew.value && provider.connected) {
	provider.join(room.value);
}

watch([isNew, provider.connected], ([isNew, connected]) => {
	if (!isNew && connected) {
		provider.join(room.value);
	}
});

provider.on('debug', (...data) => {
	console.dir(data, { depth: null });
});

provider.on('user:add', (user: AwarenessUser) => {
	console.log('user:add', user);
	awarenessStore.setActiveUser(user.uid, user);
});

provider.on('user:remove', (uid: string) => {
	console.log('user:remove', uid);
	awarenessStore.removeActiveUser(uid);
});

provider.on('field:activate', (uid: string, payload: { field: ActiveField }) => {
	console.log('field:activate', payload.field);
	awarenessStore.setActiveField(uid, payload.field);
});

provider.on('field:deactivate', (uid: string) => {
	console.log('field:deactivate', uid);
	awarenessStore.removeActiveField(uid);
});

onUnmounted(() => {
	provider.leave();
});
</script>

<template>
	<div v-if="collaborativeEditingEnabled" class="collaborative-interface">
		<div v-if="!provider.connected.value" class="connection-status">Collaboration status: connecting</div>
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
