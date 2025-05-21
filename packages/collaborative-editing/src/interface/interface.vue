<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, onUnmounted, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { AwarenessUserAddPayload } from '../types/events';
import { useAvatarStacks } from './composables/use-avatar-stacks';
import { useCurrentUser } from './composables/use-current-user';
import { useDoc } from './composables/use-doc';
import { useFieldAwareness } from './composables/use-field-awareness';
import { useAwarenessStore } from './stores/awarenessStore';
import { useFieldMeta } from './composables/use-field-meta';
import './styles.css';
import type { ActiveField } from './types';

const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const settings = useSettings();
const awarenessStore = useAwarenessStore();
const currentUser = useCurrentUser();
const fieldMeta = useFieldMeta();

const collaborativeEditingEnabled = computed(() => {
	const moduleEnabled = (settingsStore.settings as Settings)?.module_bar.find(
		(module) => module.type === 'module' && module.id === 'collab-module',
	)?.enabled;
	const enabled = settings.settings.value?.enabled_globally;
	return moduleEnabled && enabled;
});

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

interface FieldValue {
	field: string;
	value: unknown;
}

const emit = defineEmits<{
	setFieldValue: [FieldValue];
	saveAndStay: [{}];
}>();

const provider = useDoc({
	onFieldChange(field, value) {
		emit('setFieldValue', { field, value });
	},
});

// Initialize field awareness with registry
const fieldAwareness = useFieldAwareness(provider);

useAvatarStacks();

const isNew = computed(() => props.primaryKey === '+');
const room = computed(() => props.collection + ':' + props.primaryKey);

if (collaborativeEditingEnabled.value && !provider.connected.value) {
	provider.connect();
}

if (!isNew.value && provider.connected.value) {
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

provider.on('user:add', (user: Omit<AwarenessUserAddPayload, 'event' | 'type' | 'action'>) => {
	const userAwareness = {
		...user,
		isCurrentUser: user.id === currentUser.value.id,
	};
	awarenessStore.setActiveUser(user.uid, userAwareness);
});

provider.on('user:remove', (uid: string) => {
	awarenessStore.removeActiveUser(uid);
});

provider.on('field:activate', (uid: string, payload: { field: ActiveField }) => {
	const fieldMetaData = fieldMeta.getFieldMetaFromPayload(payload.field);
	if (fieldMetaData) {
		awarenessStore.setActiveField(uid, {
			...fieldMetaData,
			uid,
			lastUpdated: Date.now(),
		});
	}
});

provider.on('field:deactivate', (uid: string) => {
	awarenessStore.removeActiveField(uid);
});

provider.on('item:save', () => {
	emit('saveAndStay', {});
});

onUnmounted(() => {
	provider.leave();
	awarenessStore.reset();
	fieldAwareness.cleanup();
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
