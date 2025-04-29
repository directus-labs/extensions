import { groupBy, uniqBy } from 'lodash-es';
import { onUnmounted, ref, watch } from 'vue';
import AvatarStack from '../interface/components/avatar-stack.vue';
import { useCollaborationStore } from '../stores/collaboration';
import { getDataFromActiveFieldName, getFieldFromDOM } from '../utils';
import { createAppWithDirectus } from '../utils/create-app-with-directus';
import { useCurrentUser } from './use-current-user';

interface AppInstance {
	unmount: () => void;
}

export function useAvatarStacks() {
	const apps = ref<AppInstance[]>([]);
	const currentUser = useCurrentUser();
	const collaborationStore = useCollaborationStore();

	watch(() => collaborationStore.groupedByActiveField, (activeFields) => {
		// Clean up existing avatar stacks
		for (const app of apps.value) {
			app.unmount();
		}

		apps.value = [];

		// Create new avatar stacks for fields with users
		const presenceByField = groupBy(activeFields, 'key');

		for (const field in presenceByField) {
			if (!field || typeof field !== 'string' || field === 'undefined') continue;

			// Use data-field and data-collection attributes to find fields
			const fieldData = getDataFromActiveFieldName(field);
			if (!fieldData) continue;

			const { collection, field: fieldName, id } = fieldData;

			const fieldElement = getFieldFromDOM(collection, fieldName, id);

			if (!fieldElement) {
				continue;
			}

			// Find the field container
			const fieldContainer = fieldElement.closest('.field') || fieldElement;

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
					fieldElement.parentElement?.insertBefore(container, fieldElement.nextSibling);
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
	const headerContainer = ref<HTMLElement | null>(null);
	const headerUsers = ref(collaborationStore.documentActiveUsers);

	function createHeaderAvatarStack() {
		const titleContainer = document.querySelector('.title-container')
			|| document.querySelector('.module-bar-title')
			|| document.querySelector('.module-header')
			|| document.querySelector('header');

		if (!titleContainer) {
			return;
		}

		// Clean up existing container if it exists
		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}

		const container = document.createElement('div');
		container.classList.add('avatar-stack-container');
		headerContainer.value = container;

		titleContainer.append(container);

		const app = createAppWithDirectus(AvatarStack, {
			users: headerUsers,
		});

		console.warn('Creating header avatar stack with users:', collaborationStore.documentActiveUsers);

		headerApp.value = app;
		app.mount(container);
	}

	// Watch for changes to documentActiveUsers and update the header stack
	watch(() => collaborationStore.documentActiveUsers, (newUsers) => {
		console.warn('documentActiveUsers changed:', newUsers);
		headerUsers.value = newUsers;
	}, { deep: true });

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

		if (headerContainer.value) {
			headerContainer.value.remove();
			headerContainer.value = null;
		}
	});

	return {
		createHeaderAvatarStack,
	};
}
