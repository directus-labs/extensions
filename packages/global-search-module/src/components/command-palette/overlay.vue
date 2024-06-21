<script setup lang="ts">
const active = defineModel<boolean>('active')
</script>

<template>
  <div class="overlay-wrapper" :class="{ active }" >
    <div class="overlay" @click="active = !active" />
    <div v-if="active" class="content"><slot /></div>
  </div>
</template>

<style scoped lang="scss">
.overlay-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: var(--v-overlay-z-index, 600);
  pointer-events: none;

  &.active {
    pointer-events: auto;

    .overlay {
      opacity: 0.2;
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--theme--foreground-subdued);
    opacity: 0;
    transition: opacity var(--fast) var(--transition);
  }

  .content {
    pointer-events: auto;
    position: relative;
  }
}

</style>
