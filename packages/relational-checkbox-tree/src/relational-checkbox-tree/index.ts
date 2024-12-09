import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
	id: "nested-m2m-tree",
  name: "Checkbox (Relational Tree)",
  icon: "account_tree",
	description: 'This is my custom interface!',
	component: InterfaceComponent,
  types: ["json"],
  group: "relational",
  options: ({ field }) => {
    const collection = field?.meta?.options?.rootCollection;
    const template = field?.meta?.options?.template;

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
        field: "filter",
        name: "Filter",
        type: "json",
        meta: {
          interface: "system-filter",
          options: {
            collectionName: collection,
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
        field: "pathMap",
        name: "Path Map",
        type: "json",
        meta: {
          interface: "relational-checkbox-tree-options-path-map",
          options: {
            collectionName: collection,
            template,
          },
          width: "full",
        },
      },
      {
        field: "valueField",
        name: "Value Field",
        type: "string",
        meta: {
          interface: "system-field",
          options: {
            collectionName: collection,
            allowPrimaryKey: true,
          },
          width: "full",
        },
      },
      {
        field: "sortField",
        name: "Sort Field",
        type: "string",
        meta: {
          interface: "system-field",
          options: {
            collectionName: collection,
            allowPrimaryKey: true,
          },
          width: "full",
        },
      },
      {
        field: "sortAs",
        name: "Sort As",
        type: "string",
        meta: {
          interface: "select-dropdown",
          options: {
            choices: [
              { text: 'Ascending', value: 'asc' },
              { text: 'Descending', value: 'desc' },
            ]
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
