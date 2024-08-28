<script setup lang="ts">
import { ref, watch } from "vue";
import { CommandInput } from "../../primitives/cmdk";

defineProps<{
  loading?: boolean;
  placeholder?: string;
  showBack?: boolean;
}>();

defineEmits<{
  back: [];
}>();

const search = defineModel<string | null>();

const input = ref<HTMLInputElement | null>(null);

watch(
  input,
  () => {
    input.value.$el.focus();
  },
  { once: true },
);
</script>

<template>
  <div class="search-input">
    <span v-if="showBack" class="back" @click="$emit('back')">
      <v-icon name="keyboard_backspace" />
    </span>
    <span v-else class="back-placeholder" />
    <CommandInput
      ref="input"
      :value="search"
      :placeholder="placeholder"
      @change="search = $event"
    />
    <v-progress-circular v-if="loading === true" indeterminate />
    <v-icon v-else-if="search" clickable name="close" @click="search = ''" />
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

  .back,
  .back-placeholder {
    margin-right: 10px;
  }

  .back {
    --v-icon-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 3px;
    background: var(--theme--background-normal);
    border-radius: 4px;
  }

  input {
    flex: 1;
    background-color: transparent;
    border: none;
    color: var(--theme--foreground);
    outline: none;
    padding: 20px 20px 20px 0px;
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
