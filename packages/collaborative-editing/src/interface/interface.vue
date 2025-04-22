<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCollaborativeEditing } from '../composables/use-collaborative-editing';

// import { useStores } from '@directus/extensions-sdk';
const emit = defineEmits<{
	setFieldValue: [FieldValue];
}>();

interface FieldValue {
	field: string;
	value: unknown;
}

const route = useRoute();
const connectionStatus = ref<string>('initializing');

const room = computed(() => `${route.params.collection}:${route.params.primaryKey}`);

/** ** Store data will be needed in the future */
// const { useCollectionsStore, useFieldsStore, useRelationsStore } = useStores();

// const collectionsStore = useCollectionsStore();
// const fieldsStore = useFieldsStore();
// const relationsStore = useRelationsStore();

// const collectionSchema = computed(() => collectionsStore.getCollection(route.params.collection as string));

/* const collectionsSchema = computed(() => collectionsStore.getCollection(route.params.collection as string));
const fields = computed(() => fieldsStore.getFieldsForCollection(route.params.collection as string));
const relations = computed(() => relationsStore.getRelationsForCollection(route.params.collection as string)); */

// Initialize collaborative editing
const { provider } = useCollaborativeEditing({
	room: room.value,
	url: `/collaboration/${room.value}`,
	onFieldValueChange: (field, value) => {
		emit('setFieldValue', { field, value });
	},
});

// Track connection status for debugging
if (provider?.provider) {
	provider.provider.on('status', ({ status }: { status: string }) => {
		connectionStatus.value = status;
		console.warn(`Collaboration status changed to: ${status}`);
	});
}

// Add drawer observation logic
onMounted(() => {
	// Create a mutation observer to detect drawer elements
	const drawerObserver = new MutationObserver((mutations) => {
		const selector = '[data-field], [data-collection]';

		mutations.forEach((mutation) => {
			if (mutation.type !== 'childList') return;

			// Check for added nodes (drawer opening)
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === 1
					&& node instanceof HTMLElement
					&& node.querySelector(selector)) {
					// const fieldsWithFieldAndCollectionDataAttributes = node.querySelectorAll(selector);
					// get client id from provider
					// const clientId = provider?.values?.doc?.clientID;
					// documentSync.setActiveField(fieldsWithFieldAndCollectionDataAttributes[0].getAttribute('data-field') as string, fieldsWithFieldAndCollectionDataAttributes[0].getAttribute('data-collection') as string);
				}
			});

			// Check for removed nodes (drawer closing)
			mutation.removedNodes.forEach((node) => {
				if (node.nodeType === 1
					&& node instanceof HTMLElement
					&& node.querySelector(selector)) {
					// provider?.awareness.setLocalField('drawerStatus', null);
				}
			});
		});
	});

	// Start observing the document body for drawer elements
	drawerObserver.observe(document.body, { childList: true, subtree: true });

	// Clean up on unmount
	onUnmounted(() => {
		drawerObserver.disconnect();
	});
});
</script>

<template>
	<div class="collaborative-interface">
		<div v-if="connectionStatus !== 'connected'" class="connection-status">
			Collaboration status: {{ connectionStatus }}
		</div>
		<slot />
	</div>
</template>

<style scoped>
.collaborative-interface {
	position: relative;
}

.connection-status {
	position: fixed;
	bottom: 10px;
	right: 10px;
	background: rgba(255, 0, 0, 0.7);
	color: white;
	padding: 5px 10px;
	border-radius: 4px;
	font-size: 12px;
	z-index: 9999;
}
</style>
