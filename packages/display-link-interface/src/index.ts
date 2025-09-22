import { defineDisplay } from "@directus/extensions-sdk";
import DisplayComponent from "./display.vue";

export default defineDisplay({
  id: "extension-display-link",
  name: "Link",
  icon: "open_in_new",
  description: "Display URLs, phone numbers, and emails with a link button",
  component: DisplayComponent,
  options: [
    {
      field: "kind",
      name: "Type",
      meta: {
        width: "full",
        interface: "select-dropdown",
        options: {
          choices: [
            {
              text: "URL",
              value: "url",
            },
            {
              text: "Telephone",
              value: "tel",
            },
            {
              text: "Email",
              value: "email",
            },
          ],
        },
      },
      schema: {
        default_value: "url",
      },
    },
    {
      field: "showLinkButton",
      name: "Show link button",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Display a link button",
        },
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: "icon",
      name: "$t:displays.formatted-value.icon",
      type: "string",
      meta: {
        width: "half",
        interface: "select-icon",
      },
      schema: {
        default_value: "open_in_new",
      },
    },
    {
      field: "showUrl",
      name: "Show URL",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Display the URL",
        },
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: "font",
      name: "$t:displays.formatted-value.font",
      meta: {
        width: "half",
        interface: "select-dropdown",
        options: {
          choices: [
            {
              text: "$t:displays.formatted-value.font_sans_serif",
              value: "sans-serif",
            },
            { text: "$t:displays.formatted-value.font_serif", value: "serif" },
            {
              text: "$t:displays.formatted-value.font_monospace",
              value: "monospace",
            },
          ],
        },
      },
      schema: {
        default_value: "sans-serif",
      },
    },
    {
      field: "showClipboard",
      name: "Copy to clipboard",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Display a copy to clipboard",
        },
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: "openInNew",
      name: "Open in new tab",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Open link in new tab",
        },
      },
      schema: {
        default_value: true,
      },
    },
    {
      field: "prefix",
      name: "$t:displays.formatted-value.prefix",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        options: {
          label: "$t:displays.formatted-value.prefix_label",
          placeholder: "https://",
          trim: true,
        },
      },
      schema: {
        default_value: "",
      },
    },
    {
      field: "suffix",
      name: "$t:displays.formatted-value.suffix",
      type: "string",
      meta: {
        width: "half",
        interface: "input",
        options: {
          label: "$t:displays.formatted-value.suffix_label",
          trim: true,
        },
      },
      schema: {
        default_value: "",
      },
    },
    {
      field: "showPrefix",
      name: "Show prefix",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Display prefix in view",
        },
      },
      schema: {
        default_value: false,
      },
    },
    {
      field: "showSuffix",
      name: "Show suffix",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
        options: {
          label: "Display suffix in view",
        },
      },
      schema: {
        default_value: false,
      },
    },
  ],
  types: ["string", "text", "uuid", "integer"],
});
