<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useCollaborativeEditing } from '../composables/use-collaborative-editing';

interface FieldValue {
	field: string;
	value: unknown;
}

const emit = defineEmits<{
	setFieldValue: [FieldValue];
}>();

const route = useRoute();
const connectionStatus = ref<string>('initializing');

const room = computed(() => `${route.params.collection}:${route.params.primaryKey}`);

// Initialize collaborative editing
const { provider } = useCollaborativeEditing({
	room: room.value,
	url: 'http://localhost:8055/collaboration/1',
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
