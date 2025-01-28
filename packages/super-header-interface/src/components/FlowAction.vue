<script setup lang="ts">
import type { FlowIdentifier } from '../types';

import { useFlows } from '../composables/useFlows';

interface FlowActionProps {
	label: string;
	icon?: string;
	kind?: 'normal' | 'info' | 'success' | 'warning' | 'danger';
	flow: FlowIdentifier;
	values: Record<string, any>;
	collection: string;
}

const props = defineProps<FlowActionProps>();
const emit = defineEmits(['flow-executed']);

const { loading, runFlow } = useFlows(props.collection);

async function handleClick() {
	try {
		const result = await runFlow(props.flow, props.values);
		emit('flow-executed', { success: true, flow: props.flow, result });
	}
	catch (error) {
		emit('flow-executed', { success: false, flow: props.flow, error });
	}
}
</script>

<template>
	<v-button
		:kind="kind"
		small
		:loading="loading"
		@click="handleClick"
	>
		{{ label }}
		<v-icon v-if="icon" :name="icon" right />
	</v-button>
</template>
