<script setup lang="ts">
import { computed, toRefs } from "vue";
import Highlights from "../../components/highlights.vue";
import Item from "../components/item.vue";
import { CommandConfig, GroupConfig } from "../registry";

const props = defineProps<{
  command: CommandConfig;
  group?: GroupConfig;
}>();

const { command } = toRefs(props);

const RenderedCommand = computed(() => command.value.render);
</script>

<template>
  <Item
    :key="command.id"
    :keywords="command.keywords"
    force-mount
    icon="history"
  >
    <div class="title-wrapper">
      <RenderedCommand v-if="command.render" />
      <div v-else v-md="command.name" />
      <span v-if="group" class="group">{{ group.name }}</span>
    </div>
    <template #description>
      <highlights v-if="command.description" :text="command.description" />
    </template>
  </Item>
</template>

<style scoped lang="scss">
.title-wrapper {
  display: flex;
  justify-content: space-between;

  gap: 12px;
  overflow-x: hidden;
  text-overflow: ellipsis;

  .group {
    font-size: 12px;
    color: var(--theme--foreground-subdued);
  }
}
</style>
