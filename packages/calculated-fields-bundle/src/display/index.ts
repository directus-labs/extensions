import { defineDisplay } from "@directus/extensions-sdk";
import DisplayComponent from "./display.vue";

export default defineDisplay({
  id: "custom",
  name: "Custom",
  icon: "box",
  description: "Display a calculated value",
  component: DisplayComponent,
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
    ];
  },
  types: ["string"],
});
