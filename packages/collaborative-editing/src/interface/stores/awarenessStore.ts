import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ActiveField, AwarenessByUid, AwarenessUser } from '../types';

export const useAwarenessStore = defineStore('awareness', () => {
	const awarenessByUid = ref<AwarenessByUid>({});
	const setActiveField = (uid: string, field: ActiveField) => {
		if (!field) {
			awarenessByUid.value[uid] = {
				user: awarenessByUid.value[uid].user,
				activeField: null,
			};
		} else {
			awarenessByUid.value[uid] = {
				...awarenessByUid.value[uid],
				activeField: field,
			};
		}
	};

	const setActiveUser = (uid: string, user: AwarenessUser) => {
		awarenessByUid.value[uid] = {
			user: user,
			activeField: awarenessByUid.value[uid]?.activeField ?? null,
		};
	};

	const removeActiveUser = (uid: string) => {
		delete awarenessByUid.value[uid];
	};

	const removeActiveField = (uid: string) => {
		if (awarenessByUid.value?.[uid]?.activeField) {
			awarenessByUid.value[uid].activeField = null;
		}
	};

	return {
		setActiveField,
		setActiveUser,
		removeActiveUser,
		removeActiveField,
		awarenessByUid,
	};
});
