import { DeepPartial, Field } from "@directus/types";

export const comments_schema: Record<string,string> = {
    table: "directus_comments",
    endpoint: "comments",
};

export const schema_directus_comments_field: DeepPartial<Field> = {
    type: "string",
    meta: {
        interface: null,
        special: null,
        hidden: true
    },
    field: "field"
};