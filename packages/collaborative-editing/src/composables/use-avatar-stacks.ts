import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { groupBy, uniqBy } from 'lodash-es';
import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../interface/components/avatar-stack.vue';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useCurrentUser } from './use-current-user';

interface AppInstance {
	unmount: () => void;
}

export function useAvatarStacks(provider: ReturnType<typeof useHocuspocusProvider>) {
	const apps = ref<AppInstance[]>([]);
	const currentUser = useCurrentUser();

	watch(() => provider.awareness.all.value, (states) => {
		// console.warn('Awareness states changed:', states);

		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Create new avatar stacks for fields with users
		const presenceByField = groupBy(states, 'activeField.field');

		for (const field in presenceByField) {
			if (!field) continue;

			const fieldEl = document.querySelector(`[field="${field}"]`);

			if (!fieldEl) {
				// console.warn(`Element not found for field: ${field}`);
				continue;
			}

			let container = fieldEl.querySelector('.field-label .avatar-stack') as HTMLElement;

			if (!container) {
				container = document.createElement('div');
				container.classList.add('avatar-stack');
				container.style.marginLeft = 'auto';
				fieldEl.closest('.field')?.querySelector('.field-label')?.append(container);
			}

			const users = presenceByField[field]?.map((state) => state.user) ?? [];

			// Filter out current user from field avatar stack
			const filteredUsers = users.filter((user) => user.id !== currentUser.value?.id);

			const app = createAppWithDirectus(AvatarStack, {
				users: uniqBy(filteredUsers, 'id'),
				right: true,
			});

			apps.value.push(app);
			app.mount(container);
		}
	}, { deep: true });

	// Create header avatar stack
	const headerApp = ref<AppInstance | null>(null);

	function createHeaderAvatarStack() {
		const titleContainer = document.querySelector('.title-container');
		if (!titleContainer) return;

		const existingStack = titleContainer.querySelector('.avatar-stack');
		if (existingStack) return;

		const container = document.createElement('div');
		titleContainer.append(container);

		const app = createAppWithDirectus(AvatarStack, {
			users: provider.activeUsers,
		});

		headerApp.value = app;
		app.mount(container);
	}

	// Clean up on unmount
	onUnmounted(() => {
		// Clean up field avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Clean up header avatar stack
		if (headerApp.value) {
			headerApp.value.unmount();
			headerApp.value = null;
		}
	});

	return {
		createHeaderAvatarStack,
	};
}
