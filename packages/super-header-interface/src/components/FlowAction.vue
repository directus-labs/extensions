<script setup lang="ts">
import { useFlows } from '../composables/useFlows';

import type { FlowIdentifier } from '../types';

interface FlowActionProps {
  label: string;
  icon?: string;
  type?: string;
  flow: FlowIdentifier;
  values: Record<string, any>;
}

const props = defineProps<FlowActionProps>();
const emit = defineEmits(['flow-executed']);

const { loading, runFlow } = useFlows();

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
    :color="type"
    small
    :loading="loading"
    @click="handleClick"
  >
    {{ label }}
    <v-icon v-if="icon" :name="icon" right />
  </v-button>
</template>
