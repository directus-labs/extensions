import { defineInterface, useStores } from "@directus/extensions-sdk";
import InterfaceNestedM2MTree from "./nested-m2m-tree.vue";

export default defineInterface({
  id: "nested-m2m-tree",
  name: "$t:interfaces.nested-m2m-tree.name",
  icon: "account_tree",
  component: InterfaceNestedM2MTree,
  types: ["json"],
  group: "relational",
  options: ({ relations, field, ...a }) => {
    const { useCollectionsStore, useRelationsStore } = useStores();
    const collectionsStore = useCollectionsStore();
    const relationsStore = useRelationsStore();

    const collection = field?.meta?.options?.rootCollection;

    return [
      {
        field: "rootCollection",
        name: "Root Collection",
        type: "string",
        meta: {
          interface: "system-collection",
          options: {
            includeSystem: false,
          },
          width: "full",
        },
      },
      {
        field: "template",
        name: "Template",
        type: "string",
        meta: {
          interface: "system-display-template",
          options: {
            collectionName: collection,
          },
          width: "full",
        },
      },
      {
        field: "options",
        type: "json",
        name: "Levels",
        meta: {
          width: "full",
          interface: "relational-checkbox-tree-options",
          options: {
            parentCollection: collection,
          },
        },
      },
      // {
      //   field: "levels",
      //   name: "$t:interfaces.nested-m2m-tree.levels",
      //   type: "json",
      //   meta: {
      //     interface: "list",
      //     options: {
      //       template: "{{ relationalField }} ({{ filter }})",
      //       fields: [
      //         {
      //           field: "relationalField",
      //           name: "$t:interfaces.nested-m2m-tree.relational_field",
      //           type: "string",
      //           meta: {
      //             interface: "select-dropdown",
      //             options: {
      //               allowNone: true,
      //               choices: '{{$component.getFieldChoices(rootCollection, ["alias", "m2o", "o2m"])}}',
      //             },
      //             width: "half",
      //           },
      //         },
      //         {
      //           field: "filter",
      //           name: "$t:filter",
      //           type: "json",
      //           meta: {
      //             interface: "system-filter",
      //             options: {
      //               collectionName: "{{rootCollection}}",
      //             },
      //           },
      //         },
      //         {
      //           field: "textField",
      //           name: "$t:interfaces.nested-m2m-tree.text_field",
      //           type: "string",
      //           meta: {
      //             interface: "select-dropdown",
      //             options: {
      //               allowNone: true,
      //               choices: "{{$component.getFieldChoices(rootCollection)}}",
      //             },
      //             width: "half",
      //           },
      //         },
      //         {
      //           field: "valueField",
      //           name: "$t:interfaces.nested-m2m-tree.value_field",
      //           type: "string",
      //           meta: {
      //             interface: "select-dropdown",
      //             options: {
      //               allowNone: true,
      //               choices: "{{$component.getFieldChoices(rootCollection)}}",
      //             },
      //             width: "half",
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   schema: {
      //     default_value: [],
      //   },
      // },
      {
        field: "valueCombining",
        type: "string",
        name: "Value Combining",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: "$t:all", value: "all" },
              { text: "$t:branch", value: "branch" },
              { text: "$t:leaf", value: "leaf" },
              { text: "$t:indeterminate", value: "indeterminate" },
              { text: "$t:exclusive", value: "exclusive" },
            ],
          },
          width: "half",
        },
        schema: {
          default_value: "all",
        },
      },
    ];
  },
});
