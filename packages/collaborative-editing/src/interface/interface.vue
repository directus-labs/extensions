<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Settings } from '@directus/types';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useSettings } from '../module/utils/use-settings';
import { MODULE_ID } from '../shared/constants';
import { useCurrentUser } from './composables/use-current-user';
import { useDoc } from './composables/use-doc';
import { useFieldAvatars } from './composables/use-field-avatars';
import { useFieldAwareness } from './composables/use-field-awareness';
import { useFieldMeta } from './composables/use-field-meta';
import { useHeaderAvatars } from './composables/use-header-avatars';
import { useAwarenessStore } from './stores/awarenessStore';
import './styles.css';
import type { ActiveField } from './types';

const SAVE_BUTTON_SELECTOR = '.header-bar .actions .v-button:not(.secondary) > button';

type SaveFlowStatus = 'idle' | 'commit' | 'committed' | 'cancelled';

type SaveAction = 'Default' | 'Save and Stay' | 'Save and Create New';
const saveFlowStatus = ref<SaveFlowStatus>('idle');
const storedSaveHandler = ref<() => void>(() => {});
const saveFlowRole = ref<'initiator' | 'participant' | null>(null);
const saveAction = ref<SaveAction | null>(null);
const hasLeftRoom = ref(false);

const { useSettingsStore } = useStores();
const settingsStore = useSettingsStore();
const { settings } = useSettings();
const awarenessStore = useAwarenessStore();
const currentUser = useCurrentUser();
const fieldMeta = useFieldMeta();

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

const isNew = computed(() => props.primaryKey === undefined || props.primaryKey === '+');
const room = computed(() => props.collection + ':' + props.primaryKey);

const realtimeEnabled = computed(() => {
	const moduleEnabled = (settingsStore.settings as Settings)?.module_bar.find(
		(module) => module.type === 'module' && module.id === MODULE_ID,
	)?.enabled;
	const enabledGlobally = settings.value?.enabled_globally;

	return moduleEnabled && enabledGlobally;
});

const showStatus = computed(() => {
	if (!realtimeEnabled.value) return false;
	if (isNew.value) return false;
	if (provider.connected.value) return false;

	return true;
});

watch(
	[isNew, provider.connected, realtimeEnabled],
	([isNew, connected, enabled]) => {
		if (!isNew && enabled && !connected) {
			provider.connect();
		}

		if (!isNew && connected) {
			// clear any previous data from the room
			awarenessStore.list.forEach((u) => {
				const user = awarenessStore.byUid[u.user.uid]?.user;
				if (user && user.rooms.has(room.value)) {
					awarenessStore.byUid[u.user.uid]?.user.rooms.delete(room.value);
				}
			});

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

const resetSaveFlow = () => {
	saveFlowStatus.value = 'idle';
	storedSaveHandler.value = () => {};
	saveFlowRole.value = null;
	saveAction.value = null;
};

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

const { deactivateField } = useFieldAwareness(provider);

provider.on('save:commit', () => {
	saveFlowStatus.value = 'commit';
	saveFlowRole.value = 'initiator';

	const currentUser = awarenessStore.getCurrentUser();
	if (currentUser?.user?.uid) {
		awarenessStore.removeActiveField(currentUser.user.uid);
	}
	deactivateField();
});

provider.on('save:cancel', () => {
	resetSaveFlow();
});

provider.on('save:committed', () => {
	saveFlowStatus.value = 'committed';
	if (saveFlowRole.value !== 'initiator' && saveFlowRole.value === null) {
		saveFlowRole.value = 'participant';
	}
});

function executeStoredSaveHandler() {
	// Only leave the room if we're in the drawer and haven't already left
	if (!isNew.value && !hasLeftRoom.value) {
		const currentInterface = document.querySelector(
			`[data-collection="${props.collection}"][data-primary-key="${props.primaryKey}"]`,
		);
		const isInDrawer = currentInterface?.closest('.v-drawer') !== null;

		if (isInDrawer) {
			provider.leave();
			hasLeftRoom.value = true;
		}
	}

	nextTick(() => {
		storedSaveHandler.value();
	});
}

function preventOriginalSave(e: MouseEvent) {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
}

watch([saveFlowStatus, saveFlowRole], ([saveFlowStatus, saveFlowRole]) => {
	if (saveFlowStatus === 'commit' && saveFlowRole === 'initiator') {
		executeStoredSaveHandler();
	}

	if (saveFlowStatus === 'committed' && saveFlowRole === 'participant') {
		window.location.reload();
	}
});

onMounted(() => {
	initSaveHandler();
});

function handleSaveClick(e: MouseEvent) {
	const saveButton = e.target instanceof HTMLElement ? e.target.closest(SAVE_BUTTON_SELECTOR) : null;

	if (saveButton && saveFlowStatus.value === 'idle') {
		saveAction.value = 'Default';

		storedSaveHandler.value = () => {
			// Create a new click event with the same properties
			const newEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window,
			});

			// Dispatch the event on the original target
			if (e.target instanceof HTMLElement) {
				e.target.dispatchEvent(newEvent);
			}
		};

		preventOriginalSave(e);
		provider.preSave();
	}
}

function isSavePopperMenu(element: Element): boolean {
	const text = element.textContent?.toLowerCase() || '';
	return text.includes('save and stay') || text.includes('save and create new');
}

function handlePopperMenuClick(e: Event) {
	const target = e.target as HTMLElement;
	const menuItem = target.closest('.v-list-item');

	// Only proceed if we haven't already started a save flow
	if (menuItem && isSavePopperMenu(menuItem) && saveFlowStatus.value === 'idle') {
		// Prevent the event from triggering other handlers
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		saveAction.value = menuItem.textContent as SaveAction;

		storedSaveHandler.value = () => {
			const newEvent = new MouseEvent('click', {
				bubbles: true,
				cancelable: true,
				view: window,
			});

			// Find the actual save button and trigger the click on it
			const saveButton = document.querySelector(SAVE_BUTTON_SELECTOR);
			if (saveButton) {
				saveButton.dispatchEvent(newEvent);
			}
		};

		provider.preSave();
	}
}

function initSaveHandler() {
	document.addEventListener('click', handleSaveClick);

	// Set up mutation observer for popper menu
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				for (const node of mutation.addedNodes) {
					if (node instanceof Element && node.classList.contains('v-menu-popper')) {
						// Add click handler to the menu itself
						node.addEventListener('click', handlePopperMenuClick as EventListener);
						// Also add click handler to any list items that might be added later
						const listItems = node.querySelectorAll('.v-list-item');
						listItems.forEach((item) => {
							item.addEventListener('click', handlePopperMenuClick as EventListener);
						});
					}
				}
				for (const node of mutation.removedNodes) {
					if (node instanceof Element && node.classList.contains('v-menu-popper')) {
						node.removeEventListener('click', handlePopperMenuClick as EventListener);
					}
				}
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

// Initialize field awareness with registry
useFieldAwareness(provider);
useFieldAvatars();
useHeaderAvatars(room);

onUnmounted(() => {
	// Only leave if we actually joined (not a new item) and haven't already left
	if (!isNew.value && !hasLeftRoom.value) {
		provider.leave();
	}

	document.removeEventListener('click', handleSaveClick);
});
</script>

<template>
	<div v-if="showStatus" class="collaborative-interface">
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
