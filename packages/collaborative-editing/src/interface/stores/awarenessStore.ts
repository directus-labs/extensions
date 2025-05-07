import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ActiveField, AwarenessByUid, AwarenessUser } from '../types';

export const useAwarenessStore = defineStore('awareness', () => {
	const byUid = ref<AwarenessByUid>({});
	const list = computed(() => {
		return Object.values(byUid.value);
	});

	const setActiveField = (uid: string, field: ActiveField) => {
		if (byUid.value[uid]) {
			byUid.value[uid] = {
				...byUid.value[uid],
				activeField: field,
			};
		}
	};

	const setActiveUser = (uid: string, user: AwarenessUser) => {
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

	return {
		setActiveField,
		setActiveUser,
		removeActiveUser,
		removeActiveField,
		byUid,
		withActiveField,
		list,
		reset,
		getCurrentUser,
	};
});
