import { onKeyDown } from '@vueuse/core';
import { inject, InjectionKey, provide, Ref, ref, watch } from 'vue';

const keyboadNavigationKey: InjectionKey<{
  next: () => void;
  prev: () => void;
}> = Symbol();

export function useKeyboardNavigation(length: Ref<number>) {
  const activeIndex = ref(-1);

  watch(length, (newLength) => {
    if (newLength < activeIndex.value + 1) {
      activeIndex.value = newLength - 1;
    }
  })

  onKeyDown('ArrowDown', (e) => {
    next();
    e.preventDefault();
  });
  onKeyDown('ArrowUp', (e) => {
    prev();
    e.preventDefault();
  });

  onKeyDown('Tab', (e) => {
    if (e.shiftKey) {
      prev();
    } else {
      next();
    }
    e.preventDefault();
  });

  provide(keyboadNavigationKey, { next, prev })

  return { activeIndex }

  function next() {
    if (activeIndex.value < length.value - 1) {
      activeIndex.value++;
    }
  }

  function prev() {
    if (activeIndex.value > 0) {
      activeIndex.value--;
    }
  }
}
