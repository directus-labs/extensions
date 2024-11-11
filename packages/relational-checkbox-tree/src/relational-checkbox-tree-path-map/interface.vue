<template>
  <!-- <input :value="value" @input="handleChange($event.target.value)" /> -->
  <div v-for="field in fieldsTemplateJson" :key="field.field" class="mt-2 flex justify-between ml-2">
    <div class="mr-2">
      {{ field.field }}
    </div>
    <v-input :model-value="pathMap[field.field]" @update:model-value="($e) => onPathMapChange(field.field, $e)" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from "vue";
import { getFieldsFromTemplate } from "@directus/utils";
import { Field } from "@directus/types";
import { useStores } from "@directus/extensions-sdk";

export default defineComponent({
  props: {
    value: {
      type: String,
      default: null,
    },
    collectionName: {
      type: String,
      required: true,
    },
    template: {
      type: String,
      default: "{{id}}",
    },
  },
  emits: ["input"],
  setup(props, { emit }) {
    const { collectionName, template } = toRefs(props);
    const { useFieldsStore } = useStores();
    const fieldsStore = useFieldsStore();
    const fieldsTemplateJson = computed(() => {
      const fields = getFieldsFromTemplate(template.value);
      const result: Field[] = [];
      for (const field of fields) {
        const fieldMeta: Field = fieldsStore.getField(collectionName.value, field);
        if (fieldMeta?.type === "json") {
          result.push(fieldMeta);
        }
      }

      return result;
    });

    const pathMap = computed({
      get: () => {
        if (!props.value) return {};
        if (typeof props.value === "string") {
          return JSON.parse(props.value) || {};
        }
        return props.value;
      },
      set: (value: any) => {
        emit("input", value);
      },
    });

    return {
      handleChange,
      value: props.value,
      template: template.value,
      collectionName: collectionName.value,
      fieldsTemplateJson,
      onPathMapChange,
      pathMap,
    };

    function handleChange(value: string): void {
      emit("input", value);
    }

    function onPathMapChange(field: string, value: any): void {
      pathMap.value = { ...(pathMap.value || {}), [field]: value };
    }
  },
});
</script>

<style lang="scss" scoped>
.mt-2 {
  margin-top: 0.5rem;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}

.ml-2 {
  margin-left: 0.5rem;
}

.mr-2 {
  margin-right: 0.5rem;
}
</style>
