import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ActiveField, AwarenessByUid, AwarenessUser } from '../types';
import { ACTIVE_FIELD_IDLE_TIMEOUT } from '../constants';

const CHECK_INTERVAL = 1000 * 10; // Check every 10 seconds

export const useAwarenessStore = defineStore('awareness', () => {
	const isHandlingSave = ref(false);
	const byUid = ref<AwarenessByUid>({});
	// Lookup of last updated timestamps by uid
	const fieldLastUpdated = ref<Record<string, number>>({});

	const list = computed(() => {
		return Object.values(byUid.value);
	});

	const updateActiveFieldLastUpdated = (uid: string) => {
		fieldLastUpdated.value[uid] = Date.now();
	};

	const setActiveField = (uid: string, field: ActiveField) => {
		if (byUid.value[uid]) {
			byUid.value[uid] = {
				...byUid.value[uid],
				activeField: field,
			};
			updateActiveFieldLastUpdated(uid);
		}
	};

	const setActiveUser = (uid: string, user: AwarenessUser) => {
		// Only update if the user data has actually changed
		const existingUser = byUid.value[uid]?.user;
		if (existingUser && JSON.stringify(existingUser) === JSON.stringify(user)) {
			return;
		}

		byUid.value[uid] = {
			user: user,
			activeField: byUid.value[uid]?.activeField ?? null,
		};
	};

	const addUserToRoom = (uid: string, room: string) => {
		if (byUid.value[uid]) {
			byUid.value[uid].user.rooms.add(room);
		}
	};

	const removeUserFromRoom = (uid: string, room: string) => {
		if (byUid.value[uid]) {
			byUid.value[uid].user.rooms.delete(room);
		}
	};

	const removeActiveUser = (uid: string) => {
		delete byUid.value[uid];
		delete fieldLastUpdated.value[uid];
	};

	const removeActiveField = (uid: string) => {
		if (byUid.value?.[uid]?.activeField) {
			delete fieldLastUpdated.value[uid];
			byUid.value[uid].activeField = null;
		}
	};

	const withActiveField = computed(() => {
		return Object.values(byUid.value).filter((state) => state.activeField);
	});

	const roomCollaborators = computed(() => {
		const currentUser = getCurrentUser();
		if (!currentUser?.user?.rooms || currentUser.user.rooms.size === 0) return [];

		return Object.values(byUid.value).filter((state) => {
			if (!state.user?.rooms || state.user.rooms.size === 0) return false;
			// Check if any of the user's rooms match any of the current user's rooms
			for (const room of state.user.rooms) {
				if (currentUser.user.rooms.has(room)) {
					return true;
				}
			}
			return false;
		});
	});

	const currentUserHasRoom = (room: string) => {
		const currentUser = getCurrentUser();
		return currentUser?.user?.rooms?.has(room) ?? false;
	};

	const getCurrentUser = () => {
		return Object.values(byUid.value).find((state) => state.user?.isCurrentUser);
	};

	const reset = () => {
		byUid.value = {};
		fieldLastUpdated.value = {};
	};

	// Check for idle fields periodically
	const checkIdleFields = () => {
		const now = Date.now();
		const uidsToUnlock: string[] = [];

		for (const uid in byUid.value) {
			const field = byUid.value[uid]?.activeField;
			if (!field) continue;

			if (now - (fieldLastUpdated.value[uid] ?? 0) > ACTIVE_FIELD_IDLE_TIMEOUT) {
				uidsToUnlock.push(uid);
			}
		}

		for (const uid of uidsToUnlock) {
			removeActiveField(uid);
		}
	};

	// Start the periodic check
	const intervalId = setInterval(() => {
		checkIdleFields();
	}, CHECK_INTERVAL);

	const cleanup = () => {
		clearInterval(intervalId);
	};

	return {
		setActiveField,
		setActiveUser,
		addUserToRoom,
		removeUserFromRoom,
		removeActiveUser,
		removeActiveField,
		byUid,
		withActiveField,
		list,
		reset: () => {
			cleanup();
			reset();
		},
		getCurrentUser,
		updateActiveFieldLastUpdated,
		roomCollaborators,
		fieldLastUpdated,
		currentUserHasRoom,
		isHandlingSave,
	};
});
