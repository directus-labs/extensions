import type { useHocuspocusProvider } from './use-hocuspocus-provider';
import { groupBy, uniqBy } from 'lodash-es';
import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../interface/components/avatar-stack.vue';
import { getDataFromActiveFieldName, getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useCurrentUser } from './use-current-user';

interface AppInstance {
	unmount: () => void;
}

export function useAvatarStacks(provider: ReturnType<typeof useHocuspocusProvider>) {
	const apps = ref<AppInstance[]>([]);
	const currentUser = useCurrentUser();

	watch(() => provider.awareness.all.value, (states) => {
		// Clean up existing avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Create new avatar stacks for fields with users
		const presenceByField = groupBy(states, 'activeField.field');

		for (const field in presenceByField) {
			if (!field || typeof field !== 'string' || field === 'undefined') continue;

			// Use data-field and data-collection attributes to find fields
			const fieldData = getDataFromActiveFieldName(field);
			if (!fieldData) continue;

			const { collection, field: fieldName } = fieldData;

			const fieldEl = getFieldFromDOM(fieldName, collection);

			if (!fieldEl) {
				continue;
			}

			// Find the field container
			const fieldContainer = fieldEl.closest('.field') || fieldEl;

			// Find label if it exists
			const fieldLabel = fieldContainer.querySelector('.field-label');

			// Look for existing avatar stack
			let container = fieldContainer.querySelector('.avatar-stack-container') as HTMLElement;

			if (!container) {
				container = document.createElement('div');
				container.classList.add('avatar-stack-container');

				// If field label exists, append to it, otherwise add after the field
				if (fieldLabel) {
					// Insert after the field label text
					const fieldName = fieldLabel.querySelector('.field-name');

					if (fieldName) {
						fieldName.append(container);
					}
					else {
						fieldLabel.append(container);
					}
				}
				else {
					// Insert after the field element
					fieldEl.parentElement?.insertBefore(container, fieldEl.nextSibling);
				}
			}

			const users = presenceByField[field]?.map((state) => state.user) ?? [];

			// Filter out current user from field avatar stack
			const filteredUsers = users.filter((user) => user.id !== currentUser.value?.id);

			if (filteredUsers.length === 0) {
				continue;
			}

			const app = createAppWithDirectus(AvatarStack, {
				users: uniqBy(filteredUsers, 'id'),
				small: true, // Use small avatars to fit better in the field label
			});

			apps.value.push(app);
			app.mount(container);
		}
	}, { deep: true });

	// Create header avatar stack
	const headerApp = ref<AppInstance | null>(null);

	function createHeaderAvatarStack() {
		// Try to find the title container using different selectors in Directus v10+
		const titleContainer = document.querySelector('.title-container')
			|| document.querySelector('.module-bar-title')
			|| document.querySelector('.module-header')
			|| document.querySelector('header');

		if (!titleContainer) {
			return;
		}

		const existingStack = titleContainer.querySelector('.avatar-stack');
		if (existingStack) return;

		const container = document.createElement('div');
		container.classList.add('avatar-stack-container');

		titleContainer.append(container);

		const app = createAppWithDirectus(AvatarStack, {
			users: provider.activeUsers,
		});

		headerApp.value = app;
		app.mount(container);
	}

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
