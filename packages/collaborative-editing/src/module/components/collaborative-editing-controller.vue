<script setup lang="ts">
import type { Collection, Field } from '@directus/types';
import { useStores } from '@directus/extensions-sdk';
import { computed, watch } from 'vue';
import { useSettings } from '../utils/use-settings';
import { useAwarenessStore } from '../../interface/stores/awarenessStore';

defineProps<{
	enabledGlobally: boolean | undefined;
}>();

const { useCollectionsStore, useFieldsStore } = useStores();
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const settings = useSettings();

const awarenessStore = useAwarenessStore();

const eligibleCollections = computed(() => {
	return collectionsStore.collections.filter(
		(collection: Collection) => !collection.meta?.system && !collection.meta?.singleton && collection.schema,
	);
});

const enabledCollections = computed(() => {
	const enabledCollections = settings.enabledGlobally.value ? eligibleCollections.value : [];

	return enabledCollections.map((collection: Collection) => collection.collection);
});

async function doesCollabInterfaceExists(collection: string) {
	let exists = false;
	try {
		// Check if field already exists
		const existingFields = await fieldsStore.getFieldsForCollection(collection);
		const collabFields = existingFields.filter(
			(field: Field) =>
				field.field === `collab_${collection}` && field.meta?.interface === 'presentation-collab-settings-interface',
		);

		if (collabFields.length > 0) {
			console.log(`Collab interface already exists for ${collection}`);
			exists = true;
		}
	} catch (error) {
		console.error('Error ensuring collab interface exists:', error);
		throw error;
	}

	return exists;
}

function createCollabInterfaceField(collection: string) {
	const fieldName = `collab_${collection}`;

	return {
		collection,
		field: fieldName,
		type: 'alias',
		schema: null,
		meta: {
			special: ['alias', 'no-data'],
			interface: 'presentation-collab-settings-interface',
			width: 'full',
		},
	};
}

watch(enabledCollections, async (newEnabledCollections) => {
	// Handle adding new collab interfaces
	newEnabledCollections.forEach(async (collection: string) => {
		const collabInterfaceField = await doesCollabInterfaceExists(collection);

		if (!collabInterfaceField) {
			// Create new field if none exists
			const fieldData = createCollabInterfaceField(collection);

			try {
				await fieldsStore.createField(collection, fieldData);
			} catch (error) {
				console.error(`Error creating collab interface for ${collection}:`, error);
			}
		}
	});

	// Handle removing collab interfaces
	const allCollections = eligibleCollections.value.map((collection: Collection) => collection.collection);
	const collectionsToRemove = allCollections.filter(
		(collection: string) => !newEnabledCollections.includes(collection),
	);

	for (const collection of collectionsToRemove) {
		try {
			const existingFields = await fieldsStore.getFieldsForCollection(collection);
			const collabFields = existingFields.filter(
				(field: Field) =>
					field.field === `collab_${collection}` && field.meta?.interface === 'presentation-collab-settings-interface',
			);

			// Remove each collab field found
			for (const field of collabFields) {
				try {
					await fieldsStore.deleteField(collection, field.field);
					console.log(`Removed collab interface from ${collection}`);
				} catch (error) {
					console.error(`Error removing collab interface from ${collection}:`, error);
				}
			}
		} catch (error) {
			console.error(`Error removing collab interface from ${collection}:`, error);
		}
	}
});
</script>

<template>
	<div id="collaborative-editing-controller">Collaborative Editing Enabled: {{ enabledGlobally }}</div>
</template>
