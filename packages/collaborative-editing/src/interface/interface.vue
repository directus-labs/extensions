<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCollaborativeEditing } from '../composables/use-collaborative-editing';
import { useCurrentUser } from '../composables/use-current-user';
import { useCollaborationStore } from '../stores/collaboration';

const emit = defineEmits<{
	setFieldValue: [FieldValue];
}>();
const collaborationStore = useCollaborationStore();
interface FieldValue {
	field: string;
	value: unknown;
}

const route = useRoute();

const room = computed(() => `${route.params.collection}:${route.params.primaryKey}`);
const currentUser = useCurrentUser();

function initializeProvider() {
// Initialize collaborative editing
	useCollaborativeEditing({
		room: room.value,
		url: `/collaboration/${room.value}`,
		currentUser: currentUser.value,
		onFieldValueChange: (field, value) => {
			emit('setFieldValue', { field, value });
		},
	});
}

initializeProvider();

onMounted(() => {
	console.warn('onMounted');
	initializeProvider();
});

// Watch for route changes
watch(
	() => route.fullPath,
	(newPath, oldPath) => {
		if (newPath !== oldPath) {
			// Destroy existing provider
			collaborationStore.destroyProvider();
			// Reinitialize with new room
			initializeProvider();
		}
	},
);

// destroy provider when component is unmounted
onBeforeUnmount(() => {
	console.warn('onBeforeUnmount');
	collaborationStore.destroyProvider();
});
</script>

<template>
	<div class="collaborative-interface">
		<div v-if="collaborationStore.connectionStatus !== 'connected'" class="connection-status">
			Collaboration status: {{ collaborationStore.connectionStatus }}
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
