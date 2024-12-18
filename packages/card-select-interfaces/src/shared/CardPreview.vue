<script setup lang="ts">
import { computed } from 'vue';
import type { Choice } from './types';
import { getAssetUrl } from '../utils/get-asset-url';
import { isSVG } from './helpers';

interface CardPreviewProps {
  choice: Choice;
  isSelected: boolean;
  disabled?: boolean;
  selectionType: 'radio' | 'checkbox';
  name?: string;
}

const props = withDefaults(defineProps<CardPreviewProps>(), {
  disabled: false,
});

const iconName = computed(() => {
  if (props.selectionType === 'checkbox') {
    return props.isSelected ? 'check_box' : 'check_box_outline_blank';
  }
  return props.isSelected ? 'radio_button_checked' : 'radio_button_unchecked';
});

const ariaRole = computed(() => props.selectionType === 'radio' ? 'radio' : 'checkbox');
</script>

<template>
  <div class="preview" :role="ariaRole" :aria-checked="isSelected" :aria-disabled="disabled">
    <template v-if="choice.icon_type === 'image' || choice.icon_type === 'svg'">
      <span v-if="isSVG(choice.svg_icon)" class="svg" v-html="choice.svg_icon" />
      <div v-else-if="choice.image" class="image">
        <v-image
          :src="getAssetUrl(`${choice.image}?key=system-medium-contain`)"
          :alt="choice.text"
        />
      </div>
    </template>
    <span v-else class="fallback">
      <v-icon :name="choice.icon || 'box'" x-large />
    </span>

    <div class="check-indicator">
      <v-icon
        :name="iconName"
        :color="isSelected ? 'var(--theme--primary)' : 'var(--theme--border-color)'"
        class="icon"
        :class="{
            'radio': selectionType === 'radio',
            'checkbox': selectionType === 'checkbox',
        }"
      />
    </div>
  </div>
  <v-text-overflow :text="choice.text" class="name" />
  <span v-if="choice.description" class="description">
    {{ choice.description }}
  </span>
</template>

<style lang="scss" scoped>

.preview {
  --preview-padding: 16px;
  --preview-small-padding: 8px;
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  margin-bottom: var(--preview-small-padding);
  background: var(--theme--background--subdued);
  border: var(--theme--border-width) solid var(--border-color);
  border-radius: var(--theme--border-radius);
  overflow: hidden;
  transition: all var(--fast) var(--transition);

  .svg,
  .fallback {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--preview-padding);
    user-select: none;
    -webkit-user-drag: none;
  }

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    object-fit: contain;
    padding: var(--preview-small-padding);
    user-select: none;
    -webkit-user-drag: none;
  }

  .fallback {
    color: var(--theme--primary);
    font-size: 24px;

    .v-icon {
      font-size: 48px;
    }
  }
}

.check-indicator {
  position: absolute;
  top: var(--preview-small-padding);
  left: var(--preview-small-padding);
  z-index: 1;
  padding: 0;

  .icon {
    display: block;
    background: var(--theme--background);

    &.radio {
      border-radius: 9999px;
    }

    &.checkbox {
      border-radius: 4px;
    }
  }
}

.name {
  color: var(--theme--foreground);
  font-size: 15px;
  text-align: left;
  padding: 0 4px;
}

.description {
  color: var(--theme--foreground-subdued);
  font-size: 13px;
  margin-block-start: 4px;
  line-height: 1.2;
  text-align: left;
  padding: 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
