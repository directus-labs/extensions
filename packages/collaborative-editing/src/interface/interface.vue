<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCollaborativeEditing } from '../composables/use-collaborative-editing';
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

// Initialize collaborative editing
useCollaborativeEditing({
	room: room.value,
	url: `/collaboration/${room.value}`,
	onFieldValueChange: (field, value) => {
		emit('setFieldValue', { field, value });
	},
});

onMounted(() => {
	console.warn('onMounted');
});

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
