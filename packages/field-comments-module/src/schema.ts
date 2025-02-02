import { DeepPartial, Field, Collection } from "@directus/types";

export const schema_collection_name: string = "system_field_comments";

export const schema_collection: Collection = {
    collection: schema_collection_name,
    meta: {
        collection: schema_collection_name,
        note: null,
        hidden: true,
        singleton: false,
        icon: null,
        color: null,
        translations: null,
        display_template: null,
        preview_url: null,
        versioning: false,
        sort_field: null,
        archive_field: null,
        archive_value: null,
        unarchive_value: null,
        archive_app_filter: false,
        item_duplication_fields: null,
        accountability: null,
        system: true,
        sort: null,
        group: null,
        collapse: 'locked',
    },
    schema: {
        name: schema_collection_name,
    },
};

export const schema_field_field: DeepPartial<Field> = {
    type: "integer",
    meta: {
        interface: null,
        special: ["m2o"],
        required: true
    },
    field: "field"
};

export const schema_field_comment: DeepPartial<Field> = {
    type: "text",
    meta: {
        interface: null,
        special: null,
        required: true
    },
    field: "comment"
};

export const schema_field_collection: DeepPartial<Field> = {
    type: "string",
    meta: {
        interface: null,
        special: ["m2o"],
        required: true
    },
    field: "collection"
};

export const schema_field_item: DeepPartial<Field> = {
    type: "string",
    meta: {
        interface: null,
        special: null,
        required: true
    },
    field: "item"
};

export const schema_field_date_created: DeepPartial<Field> = {
    type: "dateTime",
    meta: {
        interface: null,
        special: ["date-created"]
    },
    field: "date_created"
};

export const schema_field_date_updated: DeepPartial<Field> = {
    type: "dateTime",
    meta: {
        interface: null,
        special: ["date-updated"]
    },
    field: "date_updated"
};

export const schema_field_user_created: DeepPartial<Field> = {
    type: "uuid",
    meta: {
        interface: null,
        special: ["m2o"],
        required: true
    },
    field: "user_created"
};

export const schema_field_user_updated: DeepPartial<Field> = {
    type: "uuid",
    meta: {
        interface: null,
        special: ["m2o"],
        required: true
    },
    field: "user_updated"
};

export const field_relation = {
    collection: schema_collection_name,
    field: "field",
    related_collection: "directus_fields",
    meta: {
        sort_field: null
    },
    schema: {
        on_delete: "SET NULL"
    }
};

export const collection_relation = {
    collection: schema_collection_name,
    field: "collection",
    related_collection: "directus_collections",
    meta: {
        sort_field: null
    },
    schema: {
        on_delete: "SET NULL"
    }
};

export const user_created_relation = {
    collection: schema_collection_name,
    field: "user_created",
    related_collection: "directus_users",
    meta: {
        sort_field: null
    },
    schema: {
        on_delete: "SET NULL"
    }
};

export const user_updated_relation = {
    collection: schema_collection_name,
    field: "user_updated",
    related_collection: "directus_users",
    meta: {
        sort_field: null
    },
    schema: {
        on_delete: "SET NULL"
    }
};