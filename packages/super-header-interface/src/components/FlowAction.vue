<script setup lang="ts">
import type { FlowIdentifier } from '../types';

import { useFlows } from '../composables/useFlows';

interface FlowActionProps {
	label: string;
	icon?: string;
	kind?: 'normal' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
	flow: FlowIdentifier;
	values: Record<string, any>;
	collection: string;
}

const props = withDefaults(defineProps<FlowActionProps>(), {
	kind: 'normal',
});

const { loading, runFlow } = useFlows(props.collection);

async function handleClick() {
	await runFlow(props.flow, props.values);
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
