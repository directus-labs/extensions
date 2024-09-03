<script setup lang="ts">
import formatTitle from "@directus/format-title";
import { Flow, PrimaryKey } from "@directus/types";
import { useApi, useStores } from "@directus/extensions-sdk";
import { computed, ref, unref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { useCommandContext } from "../../command-palette";
import { useCommandRouter } from "../../command-palette/router/router";
import { useUnexpectedError } from "../../composables/use-unexpected-error";

const props = defineProps<{
  flow: Flow;
  location: "item" | "collection";
}>();

const { useNotificationsStore } = useStores();
const { t } = useI18n();

const unexpectedError = useUnexpectedError();
const notificationsStore = useNotificationsStore();
const api = useApi();
const route = useRoute();
const { close } = useCommandContext();
const { pop: goBack } = useCommandRouter();

const selection = ref<PrimaryKey[]>([]);
const confirmValues = ref<Record<string, any> | null>();

const collection = computed(() => route.params.collection);
const primaryKey = computed(() => route.params.primaryKey);

async function runFlow() {
  const flow = props.flow;

  try {
    if (
      props.location === "collection" &&
      flow.options?.requireSelection === false &&
      selection.value.length === 0
    ) {
      await api.post(`/flows/trigger/${flow.id}`, {
        ...(unref(confirmValues) ?? {}),
        collection: collection.value,
      });
    } else {
      const keys = primaryKey.value ? [primaryKey.value] : selection.value;

      await api.post(`/flows/trigger/${flow.id}`, {
        ...unref(confirmValues),
        collection: collection.value,
        keys,
      });
    }

    notificationsStore.add({
      title: t("run_flow_success", { flow: flow.name }),
    });

    resetConfirm();
    close();
  } catch (error) {
    unexpectedError(error);
  }
}

const isConfirmButtonDisabled = computed(() => {
  for (const field of confirmDetails.value?.fields || []) {
    if (
      field.meta?.required &&
      (!confirmValues.value ||
        confirmValues.value[field.field] === null ||
        confirmValues.value[field.field] === undefined)
    ) {
      return true;
    }
  }

  return false;
});

const confirmDetails = computed(() => {
  const flow = props.flow;

  if (!flow.options?.requireConfirmation) return null;

  return {
    description: flow.options.confirmationDescription,
    fields: (flow.options.fields ?? []).map((field: Record<string, any>) => ({
      ...field,
      name: !field.name && field.field ? formatTitle(field.field) : field.name,
    })),
  };
});

const confirmButtonCTA = computed(() => {
  if (props.location === "item") return t("run_flow_on_current");
  if (unref(selection).length === 0) return t("run_flow");
  return t("run_flow_on_selected", unref(selection).length);
});

const displayCustomConfirmDialog = computed(() => !!confirmDetails.value);

const resetConfirm = () => {
  goBack();
};
</script>

<template>
  <v-dialog :model-value="displayCustomConfirmDialog" @esc="resetConfirm">
    <v-card class="allow-drawer">
      <v-card-title>{{
        confirmDetails!.description ?? t("run_flow_confirm")
      }}</v-card-title>
      <v-card-text class="confirm-form">
        <v-form
          v-if="confirmDetails!.fields && confirmDetails!.fields.length > 0"
          :fields="confirmDetails!.fields"
          :model-value="confirmValues"
          autofocus
          primary-key="+"
          @update:model-value="confirmValues = $event"
        />
      </v-card-text>

      <v-card-actions>
        <v-button secondary @click="resetConfirm">
          {{ t("cancel") }}
        </v-button>
        <v-button :disabled="isConfirmButtonDisabled" @click="runFlow">
          {{ confirmButtonCTA }}
        </v-button>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
