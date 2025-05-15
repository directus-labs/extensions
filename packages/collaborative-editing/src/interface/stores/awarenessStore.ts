import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ActiveField, AwarenessByUid, AwarenessUser } from '../types';
import { ACTIVE_FIELD_IDLE_TIMEOUT } from '../constants';

const CHECK_INTERVAL = 1000 * 10; // Check every 10 seconds

export const useAwarenessStore = defineStore('awareness', () => {
	const byUid = ref<AwarenessByUid>({});
	const list = computed(() => {
		return Object.values(byUid.value);
	});

	const updateActiveFieldLastUpdated = ({
		collection,
		field,
		primaryKey,
	}: Omit<ActiveField, 'lastUpdated' | 'uid'>) => {
		Object.values(byUid.value).forEach((state) => {
			if (
				state.activeField &&
				state.activeField.collection === collection &&
				state.activeField.field === field &&
				state.activeField.primaryKey === primaryKey
			) {
				state.activeField.lastUpdated = Date.now();
			}
		});
	};

	const setActiveField = (uid: string, field: ActiveField) => {
		if (byUid.value[uid]) {
			byUid.value[uid] = {
				...byUid.value[uid],
				activeField: field,
			};
			updateActiveFieldLastUpdated(field);
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

	const removeActiveUser = (uid: string) => {
		delete byUid.value[uid];
	};

	const removeActiveField = (uid: string) => {
		if (byUid.value?.[uid]?.activeField) {
			byUid.value[uid].activeField = null;
		}
	};

	const withActiveField = computed(() => {
		return Object.values(byUid.value).filter((state) => state.activeField);
	});

	const getCurrentUser = () => {
		return Object.values(byUid.value).find((state) => state.user?.isCurrentUser);
	};

	const reset = () => {
		byUid.value = {};
	};

	// Check for idle fields periodically
	const checkIdleFields = () => {
		const now = Date.now();
		const uidsToUnlock: string[] = [];

		for (const uid in byUid.value) {
			if (now - (byUid.value?.[uid]?.activeField?.lastUpdated ?? 0) > ACTIVE_FIELD_IDLE_TIMEOUT) {
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
	};
});
