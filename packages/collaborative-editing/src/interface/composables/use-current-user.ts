import { useStores } from '@directus/extensions-sdk';
import { useLocalStorage } from '@vueuse/core';
import { pick } from 'lodash-es';
import { computed } from 'vue';
import { AwarenessColor, AwarenessUser } from '../types';

const colors: AwarenessColor[] = ['purple', 'blue', 'green', 'yellow', 'orange', 'red'];

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
			color: userColor.value as AwarenessColor,
			uid: currentUser.id,
			isCurrentUser: true,
		}),
	);
}
