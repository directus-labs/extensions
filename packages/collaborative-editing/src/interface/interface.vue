<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { useFieldAvatars } from './composables/use-field-avatars';
import { useHeaderAvatars } from './composables/use-header-avatars';
import { useCurrentUser } from './composables/use-current-user';
import { useDoc } from './composables/use-doc';
import { useFieldAwareness } from './composables/use-field-awareness';
import { useFieldMeta } from './composables/use-field-meta';
import { useAwarenessStore } from './stores/awarenessStore';
import { useRouter } from 'vue-router';
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
}>();

const provider = useDoc({
	onFieldChange(field, value) {
		emit('setFieldValue', { field, value });
	},
});

// Initialize field awareness with registry
useFieldAwareness(provider);

useFieldAvatars();

const isNew = computed(() => props.primaryKey === undefined || props.primaryKey === '+');
const room = computed(() => props.collection + ':' + props.primaryKey);

useHeaderAvatars(room);

watch(
	[isNew, provider.connected, collaborativeEditingEnabled],
	([isNew, connected, enabled]) => {
		if (!isNew && enabled && !connected) {
			provider.connect();
		}

		if (!isNew && connected) {
			provider.join(room.value);
		}
	},
	{ immediate: true },
);

provider.on('debug', (...data) => {
	//console.dir(data, { depth: null });
});

provider.on('user:add', (user: any) => {
	const existingUser = awarenessStore.byUid[user.uid];

	// For sync events, the room isn't included in the user object, so we use the current room
	const userRoom = user.room || room.value;

	if (isNew.value) {
		return;
	}

	if (existingUser) {
		// User already exists, just add the room
		awarenessStore.addUserToRoom(user.uid, userRoom);
	} else {
		// New user, create them with the room
		const userAwareness = {
			...user,
			isCurrentUser: user.id === currentUser.value.id,
			rooms: new Set<string>(),
		};

		awarenessStore.setActiveUser(user.uid, userAwareness);
		awarenessStore.addUserToRoom(user.uid, userRoom);
	}
});

provider.on('user:remove', (payload: { uid: string; room: string }) => {
	if (isNew.value) {
		return;
	}

	awarenessStore.removeUserFromRoom(payload.uid, payload.room);

	// remove user if they have no more rooms
	const userState = awarenessStore.byUid[payload.uid];
	if (userState && userState.user.rooms.size === 0) {
		awarenessStore.removeActiveUser(payload.uid);
	}
});

provider.on('field:activate', (uid: string, payload: { field: ActiveField }) => {
	// Skip field activation for new items
	if (isNew.value) {
		return;
	}

	const fieldMetaData = fieldMeta.getFieldMetaFromPayload(payload.field);
	if (fieldMetaData) {
		awarenessStore.setActiveField(uid, {
			...fieldMetaData,
			uid,
		});
	}
});

provider.on('field:deactivate', (uid: string) => {
	awarenessStore.removeActiveField(uid);
});

provider.on('item:save', (roomValue: string) => {
	// NOTE: might make sense to pop a notification here to alert clients
	// that the item has been comitted by another user
});

onUnmounted(() => {
	// Only leave if we actually joined (not a new item)
	if (!isNew.value) {
		provider.leave();
	}
});
</script>

<template>
	<div v-if="collaborativeEditingEnabled && !provider.connected.value" class="collaborative-interface">
		<v-notice type="danger" center class="connection-status">Realtime status: connecting</v-notice>
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
	font-size: 12px;
	z-index: 9999;
}
</style>
