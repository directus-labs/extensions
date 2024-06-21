<script setup lang="ts">
import { onMounted, ref } from 'vue';

defineProps<{
  loading: boolean
}>();

defineEmits<{
  clear: []
}>()

const query = defineModel<string | null>();

const input = ref<HTMLInputElement | null>(null)

onMounted(() => input.value?.focus());
</script>

<template>
<div class="search-input">
  <v-icon name="search" />
  <input type="text" placeholder="Search" ref="input" v-model="query"/>
  <v-progress-circular v-if="loading" indeterminate />
  <v-icon v-else-if="query" name="close" clickable @click="$emit('clear')" />
</div>
</template>

<style scoped lang="scss">
.search-input {
  display: flex;
  position: relative;
  align-items: center;
  padding: 8px 12px;
  height: 54px;
  border-bottom: 1px solid var(--theme--primary);

  input {
    flex: 1;
    background-color: transparent;
    border: none;
    color: var(--theme--foreground);
    outline: none;
    padding: 20px 20px 20px 12px;
    margin: 0;
    width: 100%;
    height: 100%;
    line-height: 48px;
    font-size: var(--global-search--search-bar-font-size, 18px);
  }

  .v-progress-circular {
    position: absolute;
    right: 12px;
  }
}
</style>
