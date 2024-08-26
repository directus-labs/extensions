import { defineInterface } from "@directus/extensions-sdk";
import InterfaceComponent from "./interface.vue";

export default defineInterface({
  id: "calculated",
  name: "Calculated",
  icon: "functions",
  description: "Display a calculated value",
  component: InterfaceComponent,
  options({ collection }) {
    return [
      {
        field: "formula",
        name: "Formula",
        type: "string",
        meta: {
          width: "full",
          interface: "system-display-template",
          options: {
            collectionName: collection,
          },
        },
      },
      {
        field: "iconLeft",
        name: "$t:icon_left",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
        },
      },
      {
        field: "iconRight",
        name: "$t:icon_right",
        type: "string",
        meta: {
          width: "half",
          interface: "select-icon",
        },
      },
    ];
  },
  types: ["alias"],
  localTypes: ["standard"],
  group: "presentation",
});
