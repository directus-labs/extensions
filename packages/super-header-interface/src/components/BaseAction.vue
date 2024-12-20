<script setup lang="ts">
interface BaseActionProps {
  label: string;
  icon?: string;
  type?: string;
}

defineProps<BaseActionProps>();
</script>

<template>
  <v-button :color="type" small>
    {{ label }}
    <v-icon v-if="icon" :name="icon" right />
  </v-button>
</template>
