import { DeepPartial, Field } from "@directus/types";

export const system_field: DeepPartial<Field> = {
  field: "field_comments_settings",
  type: "json",
  meta: {
    interface: "list",
    options: {
      icon: "chat-bubble-outline",
      fields: <DeepPartial<Field[]>>[
        {
          field: "collection",
          type: "string",
          name: "$t:collection",
          meta: {
            required: true,
            interface: "system-collection",
            options: {
              includeSystem: true,
              includeSingleton: false,
            },
            note: "Select the collection where the fields reside.",
            width: "full",
          },
        },
        {
          field: "fields",
          type: "csv",
          name: "Fields to Include",
          meta: {
            interface: "system-field",
            options: {
              collectionField: "collection",
              multiple: true,
            },
            note: "Select the fields to enable comments.",
          },
        },
      ],
      // collection: "products",
      addLabel: "Add Collection",
    },
    note: "Specify which collections and fields to enable field comments.",
  },
};