<template>
  <div class="nested-m2m-tree">
    <v-notice v-if="!rootCollection" type="warning">
      <!-- {{ t('interfaces.nested-m2m-tree.setup_incomplete') }} -->
    </v-notice>
    <template v-else>
      <v-checkbox-tree
        v-model="selectedValues"
        :value-combining="valueCombining"
        :disabled="disabled"
        :choices="choices"
        @update:model-value="emitValue"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs, PropType } from "vue";
// import { useI18n } from 'vue-i18n';
import { useApi, useStores } from "@directus/extensions-sdk";
import { getFieldsFromTemplate } from "@directus/utils";
import { render } from "micromustache";

interface IOptions {
  collectionName: string;
  template?: string;
  filter?: any;
  children?: IOptions[];
  valueField?: string;
  sortField?: string;
  sortAs?: string;
}

interface IData {
  text: string;
  value: string;
  children?: IData[];
}

const props = withDefaults(
  defineProps<{
    value: any;
    rootCollection: string;
    levels: any[];
    valueCombining: string;
    disabled?: boolean;
    options: Array<IOptions>;
    template?: string;
  }>(),
  {
    value: () => [],
    levels: () => [],
    disabled: false,
    options: () => [],
    template: "{{id}}",
  }
);

const emit = defineEmits(["input"]);

// const { t } = useI18n();
const api = useApi();
const { useCollectionsStore } = useStores();
const collectionsStore = useCollectionsStore();
const { valueCombining, disabled, options, rootCollection, template: rootTemplate, value } = toRefs(props);
const choices = ref<IData[]>([]);

const selectedValues = computed({
  get: () => value.value,
  set: (value) => emitValue(value),
});

const generatedQueries = computed(() => {
  if (!options.value)
    return {
      fields: [],
    };
  if (!rootCollection.value)
    return {
      fields: [],
    };

  const fields: string[] = [...getFieldsFromTemplate(rootTemplate.value).map((field) => `fields[]=${field}`)];
  const queries = [];

  function processQuery(parent = "", opts: IOptions[]) {
    for (const option of opts) {
      if (option.template) {
        const parsedFields = getFieldsFromTemplate(option.template);
        const valueField = option.valueField || "id";
        if (parent) {
          fields.push(...parsedFields.map((field) => `fields[]=${parent}.${option.collectionName}.${field}`));
          fields.push(`fields[]=${parent}.${option.collectionName}.${valueField}`);
        } else {
          fields.push(...parsedFields.map((field) => `fields[]=${option.collectionName}.${field}`));
          fields.push(`fields[]=${option.collectionName}.${valueField}`);
        }
      } else {
        if (parent) {
          fields.push(`fields[]=${parent}.${option.collectionName}.id`);
        } else {
          fields.push(`fields[]=${option.collectionName}.id`);
        }
      }

      if (option.children) {
        let childrenCollectionPath = "";
        if (parent) {
          childrenCollectionPath = `${parent}.${option.collectionName}`;
        } else {
          childrenCollectionPath = option.collectionName;
        }
        processQuery(childrenCollectionPath, option.children);
      }
    }
  }

  function processDeepFilter(result: any = {}, opts: IOptions[]) {
    for (const option of opts) {
      if (option.collectionName) {
        result[option.collectionName] = {};
        if (option.filter) {
          result[option.collectionName]._filter = option.filter;
        }
  
        const sortAs = option.sortAs || "asc";
        let sortField = option.sortField || "id";
        if (sortAs === "desc") {
          sortField = `-${sortField}`;
        }
        result[option.collectionName]._sort = sortField;
  
        if (option.children) {
          processDeepFilter(result[option.collectionName], option.children);
        }
      }
    }
  }

  processQuery("", options.value);
  const deepFilter = {};
  processDeepFilter(deepFilter, options.value);

  return {
    fields,
    deepFilter: JSON.stringify(deepFilter),
  };
});

async function load() {
  if (!rootCollection.value) return;
  const queries = [
    ...generatedQueries.value?.fields,
    `deep=${generatedQueries.value?.deepFilter}`,
  ];

  const {
    data: { data },
  } = await api.get(`/items/${rootCollection.value}?${queries.join("&")}`);

  choices.value = parseResult(data, [
    {
      collectionName: rootCollection.value,
      template: rootTemplate.value,
      children: options.value,
    },
  ]);
}

function parseResult(data: any, opts: IOptions[]): IData[] {
  const rows: IData[] = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const childrenKey = Object.keys(item).find((key) => Array.isArray(item[key]));
    const option = opts[0];
    const template = option?.template || "{{id}}";
    const valueField = option?.valueField || "id";
    if (childrenKey) {
      const childrenRows = parseResult(item[childrenKey], option?.children || []);
      rows.push({
        text: render(template, item),
        value: item[valueField],
        children: childrenRows,
      });
    } else {
      const row: IData = {
        text: render(template, item),
        value: item[valueField],
        children: [],
      };

      rows.push(row);
    }
  }

  return rows;
}

function emitValue(value: any) {
  emit("input", value);
}

watch(
  [rootCollection],
  () => {
    load();
  },
  {
    immediate: true,
  }
);
</script>
