<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, onUnmounted, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { useActiveField } from './composables/use-active-field';
import { useAvatarStacks } from './composables/use-avatar-stacks';
import { useDoc } from './composables/use-doc';
import { useCurrentUser } from './composables/use-current-user';
import { useAwarenessStore } from './stores/awarenessStore';
import type { ActiveField } from './types';
import { AwarenessUserAddPayload } from '../types/events';
import { useFieldLocking } from './composables/use-field-locking';
import { useFieldBorders } from './composables/use-field-borders';
const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const settings = useSettings();
const awarenessStore = useAwarenessStore();
const currentUser = useCurrentUser();
const route = useRoute();
const collaborativeEditingEnabled = computed(() => {
	const moduleEnabled = (settingsStore.settings as Settings).module_bar.find(
		(module) => module.type === 'module' && module.id === 'collab-module',
	)?.enabled;
	const enabled = settings.settings.value?.collaborativeEditingEnabled;
	return moduleEnabled && enabled;
});

const props = defineProps<{
	collection: string;
	primaryKey: string;
}>();

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

const provider = useDoc({
	onFieldChange(field, value) {
		emit('setFieldValue', { field, value });
	},
});

useActiveField(provider);
useFieldLocking();
useFieldBorders();
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
	//@TODO In cases where user info needs to be anonymized, make sure the current user's info still comes through the provider.
	// otherwise, we can't use this method of knowing if this is the current user or not.
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
	console.log('field:activate', payload.field);
	awarenessStore.setActiveField(uid, payload.field);
});

provider.on('field:deactivate', (uid: string) => {
	console.log('field:deactivate', uid);
	awarenessStore.removeActiveField(uid);
});

onUnmounted(() => {
	provider.leave();
	awarenessStore.reset();
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
