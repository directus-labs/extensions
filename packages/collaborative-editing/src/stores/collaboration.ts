import type { ActiveFieldItem, Awareness, AwarenessState, HocuspocusProviderOptions, User } from '../types';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import * as Y from 'yjs';

export const useCollaborationStore = defineStore('collaboration', () => {
	// State
	const doc = ref<Y.Doc | null>(null);
	const docValues = ref<Y.Map<any> | null>(null);
	const provider = ref<HocuspocusProvider | null>(null);
	const connectionStatus = ref<string>('initializing');
	const documentAwarenessStates = ref<AwarenessState[]>([]);
	const globalAwarenessRef = ref<Awareness | null>(null);
	const documentAwarenessRef = ref<Awareness | null>(null);
	const currentUser = ref<User | null>(null);
	const providerIndex = ref<number>(0);

	// Initialize provider
	function initializeProvider(options: HocuspocusProviderOptions & { currentUser?: User | null }): void {
		if (providerIndex.value > 0) {
			console.warn('provider already exists - destroying existing provider and creating new one');
			destroyProvider();
		}

		// Set the current user if provided
		if (options.currentUser) {
			currentUser.value = options.currentUser;
		}

		// Initialize a new YJS doc
		const newDoc = new Y.Doc();
		doc.value = newDoc;
		docValues.value = newDoc.getMap('values');

		// Initialize HocuspocusProvider
		const newProvider = new HocuspocusProvider({
			url: options.url,
			name: options.name,
			document: newDoc,
			token: '123', // @TODO: Need to pass a token here
			onStatus: ({ status }) => {
				connectionStatus.value = status;
			},
			onAwarenessChange: () => {
				if (!newProvider.awareness) return;

				const states = Array.from(newProvider.awareness.getStates().values()) as AwarenessState[];
				const uniqueStates = removeAllButLastUserState(states);
				documentAwarenessStates.value = uniqueStates;

				const newAwarenessState: Awareness = {
					type: 'local-awareness',
					sourceDocument: options.name,
					states: uniqueStates,
				};

				documentAwarenessRef.value = newAwarenessState;

				// Call the update callback if provided
				if (options.onAwarenessUpdate) {
					options.onAwarenessUpdate();
				}
			},
			onStateless: ({ payload }) => {
				try {
					const message = JSON.parse(payload);

					if (message.type === 'global-awareness') {
						// spread message.states into the state with matching user.id
						const newStates = message.states.map((state: AwarenessState) => {
							const existingState = globalAwarenessRef.value?.states.find((s) => s.user.id === state.user.id);

							if (message?.sourceDocument === message.sourceDocument) {
								return { ...existingState, ...state };
							}

							return existingState;
						});

						const newGlobalAwareness: Awareness = {
							type: 'global-awareness',
							sourceDocument: globalAwarenessRef.value?.sourceDocument ?? message.sourceDocument,
							states: newStates,
						};

						globalAwarenessRef.value = newGlobalAwareness;
					}
				}
				catch (error) {
					console.error('Failed to process awareness update:', error);
				}
			},
		});

		provider.value = newProvider;
		providerIndex.value++;

		// Set initial awareness state
		if (newProvider.awareness && currentUser.value) {
			newProvider.setAwarenessField('user', {
				id: currentUser.value.id,
				first_name: currentUser.value.first_name,
				last_name: currentUser.value.last_name,
				avatar: currentUser.value.avatar,
				color: currentUser.value.color,
			});
		}
	}

	// Destroy provider
	function destroyProvider(): void {
		if (provider.value) {
			provider.value.destroy();
			provider.value = null;
			doc.value = null;
		}
	}

	const documentAwarenessGetters = {
		local: computed(() => {
			const state = provider.value?.awareness?.getLocalState() as AwarenessState | null;
			return {
				user: state?.user || currentUser.value!,
				activeField: state?.activeField,
			};
		}),
		others: computed(() => {
			return documentAwarenessStates.value.filter((state) =>
				state.user?.id !== currentUser.value?.id,
			);
		}),
		all: computed(() => {
			return documentAwarenessStates.value;
		}),
		setLocalField: <T>(field: string, value: T) => {
			if (!provider.value?.awareness) return;
			provider.value.awareness.setLocalStateField(field, value);
		},
		setActiveField: (field: string | null) => {
			if (!provider.value?.awareness) return;
			provider.value.awareness.setLocalStateField('activeField', field ? { field } : null);
		},
	};

	const globalAwarenessGetters = {
		all: computed(() => {
			return globalAwarenessRef.value?.states || [];
		}),
		others: computed(() => {
			return (globalAwarenessRef.value?.states || []).filter((state: AwarenessState) =>
				state.user.id !== currentUser.value?.id,
			);
		}),
	};

	// Active Users
	const allActiveUsers = computed(() => {
		const awarenessArray = [];
		if (documentAwarenessRef.value) awarenessArray.push(documentAwarenessRef.value);
		if (globalAwarenessRef.value) awarenessArray.push(globalAwarenessRef.value);
		const users: Map<string, User> = new Map();

		awarenessArray.forEach((item) => {
			item.states.forEach((state) => {
				// Only add this user if they haven't been added already
				if (!users.has(state.user.id)) {
					users.set(state.user.id, state.user);
				}
			});
		});

		return Array.from(users.values());
	});

	const documentActiveUsers = computed(() => {
		return documentAwarenessRef.value?.states.map((state) => state.user) || [];
	});

	const globalActiveUsers = computed(() => {
		return globalAwarenessRef.value?.states.map((state) => state.user) || [];
	});

	// Grouped active fields
	const groupedByActiveField = computed(() => {
		// Combine local and global awareness states
		const documentStates = documentAwarenessRef.value?.states || [];
		const globalStates = globalAwarenessRef.value?.states || [];
		const allStates = [...documentStates, ...globalStates];

		// Create a map to store unique active fields by their key
		const activeFieldsMap = new Map<string, ActiveFieldItem>();

		// Process each state
		for (const state of allStates) {
			if (!state.activeField?.field) continue;

			// Parse the active field string (format: collection:field:id)
			const [collection, field, id] = state.activeField.field.split(':');
			if (!collection || !field || !id) continue;

			const key = state.activeField.field;

			// Only add if we haven't seen this field before
			if (!activeFieldsMap.has(key)) {
				activeFieldsMap.set(key, {
					key,
					field,
					collection,
					id,
					user: state.user,
				});
			}
		}

		// Convert map to array and return
		const activeFields = Array.from(activeFieldsMap.values());
		return activeFields;
	});

	// Utility functions
	function getUsersBySourceDocument(
		awarenessArray: Awareness[],
		sourceDocument: string,
	): User[] {
		const users: Map<string, User> = new Map();

		awarenessArray
			.filter((item) => item.sourceDocument === sourceDocument)
			.forEach((item) => {
				item.states.forEach((state) => {
					// Only add this user if they haven't been added already
					if (!users.has(state.user.id)) {
						users.set(state.user.id, state.user);
					}
				});
			});

		return Array.from(users.values());
	}

	function getUsersByActiveField(
		awarenessArray: Awareness[],
		fieldValue: string,
	): User[] {
		const users: Map<string, User> = new Map();

		awarenessArray.forEach((item) => {
			item.states.forEach((state) => {
				if (state.activeField && state.activeField.field === fieldValue
					&& !users.has(state.user.id)) {
					users.set(state.user.id, state.user);
				}
			});
		});

		return Array.from(users.values());
	}

	return {
		// State
		doc,
		docValues,
		provider,
		documentAwarenessRef,
		globalAwarenessRef,
		connectionStatus,

		// Initialization
		initializeProvider,
		destroyProvider,

		// Awareness state and methods
		documentAwareness: documentAwarenessGetters,
		globalAwareness: globalAwarenessGetters,

		// Users
		currentUser,
		allActiveUsers,
		documentActiveUsers,
		globalActiveUsers,

		// Grouped fields
		groupedByActiveField,

		// Utility functions
		getUsersBySourceDocument,
		getUsersByActiveField,
	};
});

function removeAllButLastUserState(states: AwarenessState[]): AwarenessState[] {
	// Create a map to keep track of the last occurrence index for each user ID
	const lastIndices = new Map();

	// Find the last occurrence of each user ID
	for (const [i, state] of states.entries()) {
		if (state.user && state.user.id) {
			lastIndices.set(state.user.id, i);
		}
	}

	// Filter the array to keep only the last occurrence of each user ID
	return states.filter((state, index) => {
		if (state.user && state.user.id) {
			return lastIndices.get(state.user.id) === index;
		}

		// Keep items without a user ID
		return true;
	});
}
