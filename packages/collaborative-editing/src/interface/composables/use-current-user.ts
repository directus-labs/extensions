import { useStores } from '@directus/extensions-sdk';
import { useLocalStorage } from '@vueuse/core';
import { pick } from 'lodash-es';
import { computed } from 'vue';
import { AwarenessUser } from '../types';
const colors: AwarenessUser['color'][] = ['#6644FF', '#3399FF', '#2ECDA7', '#FFC23B', '#FFA439', '#E35169'];

export function useCurrentUser() {
	const { useUserStore } = useStores();
	const userStore = useUserStore();
	const userColor = useLocalStorage<string>(
		'collab-user-color',
		colors[Math.floor(Math.random() * colors.length)] as string,
	);

	const currentUser = pick(userStore.currentUser, ['id', 'first_name', 'last_name', 'avatar']);
	return computed(
		(): AwarenessUser => ({
			...currentUser,
			color: userColor.value,
			uid: currentUser.id,
		}),
	);
}
