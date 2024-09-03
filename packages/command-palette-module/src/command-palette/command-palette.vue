<script setup lang="ts">
import { onClickOutside, useEventListener } from "@vueuse/core";
import { ref, watch } from "vue";
import { Command } from "../primitives/cmdk";
import { commandScore } from "../primitives/cmdk/utils/command-score";
import Overlay from "./components/overlay.vue";
import { provideGlobalCommandContext } from "./composables/use-global-command-state";
import RootCommands from "./root-commands.vue";
import { CommandRouterView, createCommandRouter } from "./router";
import { provideCommandRouter } from "./router/router";

const active = defineModel<boolean>("active");

const commandPalette = ref<InstanceType<typeof Command> | null>(null);
const search = ref("");

const commandRouter = createCommandRouter({
  root: RootCommands,
});

provideCommandRouter(commandRouter);

const context = provideGlobalCommandContext({
  search,
  loading: ref(false),
  router: commandRouter,
  close,
  clearSearch: clear,
});

useEventListener(commandPalette, "keydown", (e) => {
  if (e.defaultPrevented) return;

  if (e.key === "Backspace" && search.value === "") {
    if (commandRouter.pop()) e.preventDefault();
  }
});

// Ignore click events from the dialog and menu outlets
onClickOutside(commandPalette, close, {
  ignore: ["#dialog-outlet", "#menu-outlet"],
});

watch(active, (active) => {
  if (!active) {
    close();
  }
});

function close() {
  active.value = false;
  clear();
  commandRouter.clear();
}

function clear() {
  context.search.value = "";
}

function customFilter(value: string, search: string, keywords: string[]) {
  if (!search) {
    // Ensure a consistent item order if no search query is given
    const el = commandPalette.value?.$el.querySelector(
      `[data-value="${value}"]`,
    );

    const sort = el?.dataset.sort;

    if (sort !== undefined) {
      return 1 / (sort + 1);
    } else {
      return 1 / Number.MAX_SAFE_INTEGER;
    }
  } else {
    return commandScore(value, search, keywords);
  }
}

watch(commandRouter.currentCommand, () => {
  if (!commandPalette.value?.$el) return;

  commandPalette.value.$el.classList.add("pop");

  setTimeout(() => {
    if (!commandPalette.value?.$el) return;

    commandPalette.value.$el.classList.remove("pop");
  }, 200);
});
</script>

<template>
  <Overlay v-model:active="active">
    <Command
      ref="commandPalette"
      class="command-palette"
      label="Command Menu"
      :filter="customFilter"
      force-sort
    >
      <CommandRouterView />
    </Command>
  </Overlay>
</template>

<style lang="scss" scoped>
.command-palette {
  position: relative;
  margin: 10vh auto auto;
  max-width: 560px;
  background-color: var(--theme--background);
  border-radius: 8px;
  box-shadow: var(--theme--shadow);
  padding: var(--theme--spacing);
}

@keyframes pop {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.99);
  }

  100% {
    transform: scale(1);
  }
}
</style>
