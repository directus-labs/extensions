<script setup lang="ts">
import { onKeyPressed, useElementHover, whenever } from '@vueuse/core';
import { ref, toRefs } from 'vue';

const props = defineProps<{
  icon: string;
  active: boolean;
}>();
const { active } = toRefs(props);

const emit = defineEmits<{
  select: []
  hover: []
}>();

const item = ref(null);
const isHovered = useElementHover(item);

whenever(active, () => {
  item.value.scrollIntoView({ block: 'nearest' });
});

function handleMove() {
  if (isHovered.value && !active.value) {
    emit('hover');
  }
}

onKeyPressed('Enter', () => {
  if (active.value) {
    emit('select');
  }
});

</script>

<template>
  <div class="result-item" ref="item"
       :class="{ active }"
       @click="$emit('select')"
       @mousemove="handleMove">
    <v-icon :name="icon" left />
    <div class="content">
        <div class="title">
          <slot name="title" />
        </div>
        <div class="description">
          <slot name="description" />
        </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result-item {
  --v-icon-color: var(--theme--foreground-subdued);

  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;

  &.active {
    background-color: var(--theme--background-subdued);
    --v-icon-color: var(--theme--foreground);

    .title {
      color: var(--theme--foreground-accent);
    }

    .description {
      color: var(--theme--foreground);
    }
  }

  .v-icon {
    margin-right: 12px;
  }

  .content {
    flex: 1;
  }

  .title {
    color: var(--theme--foreground);
  }

  .description {
    color: var(--theme--foreground-subdued);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1
  }
}
</style>
