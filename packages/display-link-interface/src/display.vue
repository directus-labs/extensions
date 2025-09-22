<template>
  <v-null v-if="value === null" />
  <template v-else>
    <v-hover v-slot="{ hover }" class="ext-display-link">
      <div class="ext-display-link__wrapper">
        <a :href="href" :target="target" @click.stop>
          <v-icon
            v-if="showLinkButton"
            v-tooltip="`${verb} ${url}`"
            class="ext-display-link__icon"
            :name="icon"
            left
          />
        </a>

        <span v-if="showUrl" :class="[font]" class="ext-display-link__url">
          {{ displayUrl }}
        </span>

        <transition name="fade">
          <v-icon
            v-if="showClipboard && (!showUrl || hover)"
            v-tooltip="`Copy to clipboard \n ${url}`"
            class="ext-display-link__clip"
            right
            name="content_copy"
            @click.stop="copyToClipboard"
          />
        </transition>
      </div>
    </v-hover>
  </template>
</template>

<script setup lang="ts">
import { useStores } from "@directus/extensions-sdk";

type FontType = "sans-serif" | "serif" | "monospace";

const props = withDefaults(
  defineProps<{
    value: string | number | null;
    kind: "url" | "email" | "tel";
    showLinkButton: boolean;
    icon: string;
    showUrl: boolean;
    font: FontType;
    showClipboard: boolean;
    openInNew: boolean;
    prefix: string;
    suffix: string;
    showPrefix: boolean;
    showSuffix: boolean;
  }>(),
  {
    value: null,
    kind: "url",
    showLinkButton: true,
    icon: "open_in_new",
    showUrl: true,
    font: "sans-serif",
    showClipboard: true,
    openInNew: true,
    prefix: "",
    suffix: "",
    showPrefix: false,
    showSuffix: false,
  },
);

const protocols = {
  url: "",
  email: "mailto:",
  tel: "tel:",
};

const verbs = {
  url: "Open",
  email: "Send email to",
  tel: "Call",
};

const { useNotificationsStore } = useStores();
const notifStore = useNotificationsStore();

const prefix = props.showPrefix ? props.prefix : "";
const suffix = props.showSuffix ? props.suffix : "";
const displayUrl = `${prefix}${props.value}${suffix}`;
const url = `${props.prefix || ""}${props.value ?? ""}${props.suffix || ""}`;
const protocol = protocols[props.kind];
const href = `${protocol}${url}`;
const verb = verbs[props.kind];
const target = props.openInNew ? "_blank" : undefined;

async function copyToClipboard() {
  try {
    await navigator?.clipboard?.writeText(url);
    notifStore.add({
      title: "Copied!",
      type: "success",
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      notifStore.add({
        title: "Error!",
        type: "error",
        error: err,
      });
    }
  }
}
</script>

<style>
.ext-display-link {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
}
.ext-display-link__wrapper {
  display: flex;
  line-height: 18px;
}
.ext-display-link__url {
  flex-shrink: 1;
  overflow: hidden;
}
.ext-display-link__url.sans-serif {
  font-family: var(--family-sans-serif);
}
.ext-display-link__url.serif {
  font-family: var(--family-serif);
}
.ext-display-link__url.monospace {
  font-family: var(--family-monospace);
}
.ext-display-link__icon,
.ext-display-link__clip {
  --v-icon-size: 18px;
}
.ext-display-link__icon:hover,
.ext-display-link__clip:hover {
  --v-icon-color: var(--primary);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
