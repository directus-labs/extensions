<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useAvatarStack } from './composables/use-avatar-stack';
import { type DirectusProvider, useYJS } from './composables/use-yjs';

interface FieldValue {
	field: string;
	value: unknown;
}

const emit = defineEmits<{
	setFieldValue: [FieldValue];
}>();

let provider: DirectusProvider;
const { add } = useAvatarStack();

onMounted(() => {
	provider = useYJS({
		onFieldChange(field, value) {
			emit('setFieldValue', { field, value });
		},
	});

	provider.on('connected', () => {
		connectionStatus.value = 'connected';
	});

	provider.on('debug', (...data) => {
		console.dir(data, { depth: null });
	});

	provider.on('user:connect', (user) => {
		add(user);
	});
});

onUnmounted(() => {
	provider.disconnect();
});

const connectionStatus = ref<string>('initializing');
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
