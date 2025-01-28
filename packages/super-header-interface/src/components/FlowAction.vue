<script setup lang="ts">
import { useFlows } from '../composables/useFlows';

import type { FlowIdentifier } from '../types';

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

const handleClick = async () => {
  try {
    const result = await runFlow(props.flow, props.values);
    emit('flow-executed', { success: true, flow: props.flow, result });
  } catch (error) {
    emit('flow-executed', { success: false, flow: props.flow, error });
  }
};
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
