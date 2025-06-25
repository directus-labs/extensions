<script setup lang="ts">
import { useStores } from '@directus/extensions-sdk';
import type { Collection } from '@directus/types';
import { computed, watch } from 'vue';
import { generateRealtimeInterface } from '../../shared/field/generate-realtime-interface';
import { isRealtimeInterface } from '../../shared/field/is-realtime-interface';
import { realtimeInterfaceExists } from '../../shared/field/realtime-interface-exists';
import { useSettings } from '../utils/use-settings';

const ALLOWED_SYSTEM_COLLECTIONS = ['directus_users', 'directus_files'];

defineProps<{
	enabledGlobally: boolean | undefined;
}>();

const { useCollectionsStore, useFieldsStore } = useStores();
const collectionsStore = useCollectionsStore();
const fieldsStore = useFieldsStore();
const settings = useSettings();

const eligibleCollections = computed(() => {
	return collectionsStore.collections.filter((collection: Collection) => {
		// Allow specific system collections
		if (collection.meta?.system) {
			return ALLOWED_SYSTEM_COLLECTIONS.includes(collection.collection);
		}
		// Allow non-singleton collections with schema
		return !collection.meta?.singleton && collection.schema;
	});
});

const enabledCollections = computed(() => {
	const enabledCollections = settings.enabledGlobally.value ? eligibleCollections.value : [];

	return enabledCollections.map((collection: Collection) => collection.collection);
});

watch(enabledCollections, async (newEnabledCollections) => {
	// Handle adding new collab interfaces
	newEnabledCollections.forEach(async (collection: string) => {
		const existingFields = await fieldsStore.getFieldsForCollection(collection);

		if (!realtimeInterfaceExists(existingFields)) {
			// Create new field if none exists
			const fieldData = generateRealtimeInterface(collection);

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
			const collabFields = existingFields.filter(isRealtimeInterface);

			// Remove each collab field found
			for (const field of collabFields) {
				try {
					await fieldsStore.deleteField(collection, field.field);
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
	<div id="realtime-collaboration-controller">Realtime Collaboration Enabled: {{ enabledGlobally }}</div>
</template>

<style>
#realtime-collaboration-controller {
	display: none;
}
</style>
