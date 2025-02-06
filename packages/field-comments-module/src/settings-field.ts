import { DeepPartial, Field } from "@directus/types";

export const system_field: DeepPartial<Field> = {
  field: "field_comments_settings",
  type: "json",
  meta: {
    interface: "list",
    special: [
      "cast-json"
    ],
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
            width: "half",
          },
        },
        {
          field: "all_fields",
          type: "boolean",
          name: "Use All Fields",
          meta: {
            interface: "toggle",
            width: "half",
          },
          schema: {
            default_value: true,
          }
        },
        {
          field: "fields",
          type: "json",
          name: "Fields for Comments",
          meta: {
            interface: "system-field",
            options: {
              placeholder: "Using All Fields",
              collectionField: "collection",
              multiple: true,
              allowNone: true,
              allowPrimaryKey: true,
              allowForeignKeys: true,
            },
            note: "Select the fields to enable comments.",
            width: "half",
            conditions: [
							{
								rule: {
									all_fields: {
										_eq: true,
									},
								},
								hidden: true,
							},
						],
          },
        },
      ],
      addLabel: "Add Collection",
    },
    note: "Specify which collections and fields to enable field comments.",
  },
};