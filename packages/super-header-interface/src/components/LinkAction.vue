<script setup lang="ts">
import BaseAction from './BaseAction.vue';

interface LinkActionProps {
  label: string;
  icon?: string;
  type?: string;
  url: string;
}

defineProps<LinkActionProps>();
</script>

<template>
  <BaseAction :label="label" :icon="icon" :type="type" :href="url" />
</template>
