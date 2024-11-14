<template>
  <div class="v-list-group">
    <!-- :active="active"
    :to="to"
    :exact="exact"
    :query="query"
    :disabled="disabled"
    :dense="dense"
    @click="onClick" -->

    <div class="mt-2">Children</div>
    <v-list-item v-for="(item, index) in data" :key="item.id" class="input" :clickable="true">
      <v-list-item-content
        @click="
          () => {
            onEdit(index);
          }
        "
      >
        {{ formatTitle(item.collectionName) }}
      </v-list-item-content>
      <v-icon name="close" @click="() => onRemove(index)" />
    </v-list-item>
  </div>
  <div v-if="data.length <= 0" class="mt-4">
    <v-button v-tooltip.bottom="'Add'" @click="editing = true"> Add </v-button>
  </div>
  <v-drawer
    :title="parentCollection ? formatTitle(parentCollection) : '--'"
    :model-value="editing"
    icon="link"
    @update:model-value="editing = null"
    @cancel="editing = null"
  >
    <template #actions>
      <v-button v-tooltip.bottom="'Save'" icon rounded @click="onOk">
        <v-icon name="check" />
      </v-button>
    </template>

    <div class="drawer-content">
      <div>
        <div>Collection Name</div>
        <div class="mt-2">
          <interface-system-collection
            v-if="!parentCollection"
            :includeSystem="false"
            :value="collectionName"
            @input="($e) => (collectionName = $e)"
          />
          <interface-select-dropdown v-else :choices="relations" :value="collectionName" @input="($e) => (collectionName = $e)" />
        </div>
      </div>
      <div v-if="relatedCollectionDetail?.collection" class="mt-4">
        <div>Filter</div>
        <div class="mt-2">
          <interface-system-filter
            :collection-name="relatedCollectionDetail.collection"
            :value="filter"
            @input="
              ($e) => {
                filter = $e;
              }
            "
          />
        </div>
      </div>
      <div v-if="relatedCollectionDetail?.collection" class="mt-4">
        <div>Template</div>
        <div class="mt-2">
          <interface-system-display-template
            :collection-name="relatedCollectionDetail.collection"
            :value="template"
            @input="($e) => (template = $e)"
          />
          <div>
            <div>Path Map</div>
            <v-notice v-if="!fieldsTemplateJson.length" type="info" class="mt-2">
              The template does not contain any JSON fields.
            </v-notice>
            <div v-else>
              <div
                v-for="field in fieldsTemplateJson"
                :key="field.field"
                class="mt-2 flex justify-between ml-2"
              >
                <div class="mr-2">
                  {{ field.field }}
                </div>
                <v-input :model-value="pathMap[field.field]" @update:model-value="$e => onPathMapChange(field.field, $e)" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="relatedCollectionDetail?.collection" class="mt-4">
        <div>Value field</div>
        <div class="mt-2">
          <interface-system-field
            :value="valueField"
            :collection-name="relatedCollectionDetail?.collection"
            allow-primary-key
            @input="valueField = $event"
          />
        </div>
      </div>
      <div v-if="relatedCollectionDetail?.collection" class="mt-4">
        <div>Sort field</div>
        <div class="mt-2">
          <interface-system-field
            :value="sortField"
            :collection-name="relatedCollectionDetail?.collection"
            allow-primary-key
            @input="sortField = $event"
            width="half"
          />
        </div>
        <div class="mt-2">Sort As</div>
        <div class="mt-2">
          <interface-select-dropdown
            :choices="[
              { text: 'Ascending', value: 'asc' },
              { text: 'Descending', value: 'desc' },
            ]"
            :value="sortAs"
            @input="($e) => (sortAs = $e)"
            width="half"
          />
        </div>
      </div>

      <interface-relational-checkbox-tree-options
        :parent-collection="relatedCollectionDetail?.collection"
        @save="onSave"
        :value="children"
        :itemIndex="selectedIndex"
      />
    </div>
  </v-drawer>
</template>

<script lang="ts">
interface IData {
  collection: string;
  filter: any;
  sort: any;
  template: string;
  children: IData[];
}
import { computed, defineComponent, PropType, ref, toRefs, watch } from "vue";
import { useStores } from "@directus/extensions-sdk";
import { formatTitle } from "@directus/format-title";
import { getFieldsFromTemplate } from "@directus/utils";
import { Field } from "@directus/types";

export default defineComponent({
  props: {
    value: {
      type: Array as PropType<any>,
      default: () => [],
    },
    parentCollection: {
      type: String,
      default: null,
    },
    itemIndex: {
      type: Number,
      default: -1,
    },
  },
  emits: ["input", "save"],
  setup(props, { emit }) {
    const { parentCollection, value, itemIndex } = toRefs(props);
    const { useCollectionsStore, useRelationsStore, useFieldsStore } = useStores();
    const relationsStore = useRelationsStore();
    const collectionsStore = useCollectionsStore();
    const fieldsStore = useFieldsStore();
    const editing = ref<boolean | null>(null);
    const id = ref<string | null>(generateRandomString(10));
    const data = computed({
      get: () => {
        return value.value || [];
      },
      set: (value) => {
        emit("input", value);
      },
    });
    const selectedIndex = ref(-1);
    const edits = ref<{
      collectionName: string | null;
      parentId: string;
      id: string;
      children: any[];
      filter: any;
      template: string;
      sortField: string;
      valueField: string;
      sortAs: string;
      pathMap: Record<string, string>;
    }>({
      collectionName: "",
      parentId: "",
      id: "",
      children: [],
      filter: {},
      template: "",
      sortField: "",
      valueField: "",
      sortAs: "asc",
      pathMap: {},
    });

    const collectionName = computed({
      get: () => {
        return edits.value.collectionName || "";
      },
      set: (value) => {
        edits.value.collectionName = value;
      },
    });
    const filter = computed({
      get: () => {
        return edits.value.filter || {};
      },
      set: (value) => {
        edits.value.filter = value;
      },
    });
    const template = computed({
      get: () => {
        return edits.value.template || "";
      },
      set: (value) => {
        edits.value.template = value;
      },
    });
    const sortField = computed({
      get: () => {
        return edits.value.sortField || "";
      },
      set: (value) => {
        edits.value.sortField = value;
      },
    });
    const valueField = computed({
      get: () => {
        return edits.value.valueField || "";
      },
      set: (value) => {
        edits.value.valueField = value;
      },
    });
    const children = computed({
      get: () => {
        return edits.value.children || [];
      },
      set: (value) => {
        edits.value.children = value;
      },
    });
    const sortAs = computed({
      get: () => {
        return edits.value.sortAs || "asc";
      },
      set: (value) => {
        edits.value.sortAs = value;
      },
    });
    const pathMap = computed({
      get: () => {
        return edits.value.pathMap || {};
      },
      set: (value) => {
        edits.value.pathMap = value;
      },
    });

    const relations = computed(() => {
      const collections: { text: string; value: string; collection: string }[] = [];
      if (!parentCollection.value) {
        return [];
      }

      const collectionMap: Record<string, boolean> = {};

      const relationInfo = relationsStore.getRelationsForCollection(parentCollection.value);

      for (const relation of relationInfo) {
        if (parentCollection.value === relation.related_collection) {
          if (!collectionMap[relation.collection] && relation.meta?.one_field) {
            collectionMap[relation.collection] = true;
            collections.push({
              text: formatTitle(relation.collection),
              value: relation.meta.one_field,
              collection: relation.collection,
            });
          }
        } else {
          // if (!collectionMap[relation.related_collection]) {
          //   collectionMap[relation.related_collection] = true;
          //   collections.push({
          //     text: formatTitle(relation.related_collection),
          //     value: relation.field,
          //     collection: relation.related_collection,
          //   });
          // }
        }
      }
      return collections;
    });

    const relatedCollectionDetail = computed(() => {
      if (!collectionName.value) {
        return null;
      }
      return relations.value.find((relation) => relation.value === collectionName.value);
    });

    const fieldsTemplateJson = computed(() => {
      const fields = getFieldsFromTemplate(template.value);
      const result: Field[] = [];
      for (const field of fields) {
        const fieldMeta: Field = fieldsStore.getField(relatedCollectionDetail.value?.collection, field);
        if (fieldMeta?.type === 'json') {
          result.push(fieldMeta);
        }
      }

      return result;
    });

    watch([relatedCollectionDetail], () => {
      if (selectedIndex.value !== -1) {
        return;
      }
      filter.value = {};
      template.value = "";
      valueField.value = "";
      sortField.value = "";

      if (relatedCollectionDetail.value?.collection) {
        const collectionInfo = collectionsStore.getCollection(relatedCollectionDetail.value.collection);
        if (collectionInfo) {
          template.value = collectionInfo.meta?.display_template || "";
          const primaryKey = fieldsStore.getPrimaryKeyFieldForCollection(relatedCollectionDetail.value.collection);
          if (primaryKey) {
            valueField.value = primaryKey.field;
            sortField.value = primaryKey.field;
          }
          // const fields = collectionInfo.fields;
          // if (fields) {
          //   const primaryField = fields.find((field) => field.primary);
          //   if (primaryField) {
          //     valueField.value = primaryField.field;
          //   }
          // }
        }
      }
    });

    return {
      handleChange,
      editing,
      collectionName,
      onSave,
      onOk,
      onInput,
      generateRandomString,
      data,
      id,
      onEdit,
      parentCollection,
      filter,
      relations,
      relatedCollectionDetail,
      formatTitle,
      template,
      valueField,
      sortField,
      edits,
      onRemove,
      children,
      sortAs,
      selectedIndex,
      fieldsTemplateJson,
      pathMap,
      onPathMapChange
    };

    function handleChange(value: string): void {
      emit("input", value);
    }

    function onSave(payload: never[]) {
      if (selectedIndex.value === -1) {
        children.value.push(...payload);
      }
      selectedIndex.value = -1;
    }

    function onOk() {
      const payload = {
        collectionName: collectionName.value,
        parentId: id.value,
        id: generateRandomString(10),
        children: children.value,
        filter: filter.value,
        template: template.value,
        sortField: sortField.value,
        valueField: valueField.value,
        sortAs: sortAs.value,
        pathMap: pathMap.value,
      };

      let index = itemIndex.value;
      if (index === -1) {
        index = selectedIndex.value;
      }
      if (index !== -1) {
        data.value[index] = payload as never;
      } else {
        data.value.push(payload as never);
      }
      emit("save", data.value);
      editing.value = null;
      collectionName.value = "";
      filter.value = {};
      template.value = "";
      pathMap.value = {};
      emit("input", data.value);
    }

    function onInput(event: Event) {
      collectionName.value = (event.target as HTMLInputElement).value;
    }

    function generateRandomString(length: number): string {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    }

    function onEdit(index: number) {
      const item = data.value[index];
      edits.value = item;
      selectedIndex.value = index;
      editing.value = true;
    }

    function onRemove(index: number) {
      if (selectedIndex.value === index) {
        selectedIndex.value = -1;
      }
      data.value.splice(index, 1);
    }

    function onPathMapChange(field: string, value: string) {
      pathMap.value = {
        ...pathMap.value,
        [field]: value,
      };
    }
  },
});
</script>

<style scoped>
.drawer-content {
  padding: 20px;
}

.mt-4 {
  margin-top: 1rem;
}

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
