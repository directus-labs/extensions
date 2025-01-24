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

export const schema_field_id: DeepPartial<Field> = {
    field: "id",
    type: "uuid",
    meta: {
        collection: schema_collection_name,
        conditions: null,
        display: null,
        display_options: null,
        field: "id",
        group: null,
        hidden: true,
        interface: "input",
        note: null,
        options: null,
        readonly: true,
        required: false,
        special: ["uuid"],
        translations: null,
        validation: null,
        validation_message: null,
        width: "full",
    },
    schema: {
        data_type: "uuid",
        is_generated: false,
        is_indexed: false,
        is_nullable: false,
        is_primary_key: true,
        is_unique: true,
        max_length: null,
        name: "id",
        numeric_precision: null,
        numeric_scale: null,
    },
};

export const schema_field_field: DeepPartial<Field> = {
    field: "field",
    type: "integer",
    meta: {
        collection: schema_collection_name,
        conditions: null,
        display: null,
        display_options: null,
        field: "field",
        group: null,
        hidden: true,
        interface: "select-dropdown-m2o",
        note: null,
        options: {
            enableCreate: false,
            template: "{{field}}",
        },
        readonly: false,
        required: true,
        special: ["m2o"],
        translations: null,
        validation: null,
        validation_message: null,
        width: "full",
    },
    schema: {
        data_type: "integer",
        foreign_key_column: "id",
        foreign_key_schema: "public",
        foreign_key_table: "directus_fields",
        is_generated: false,
        is_indexed: false,
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        max_length: null,
        name: "field",
        numeric_precision: 32,
        numeric_scale: 0,
    },
};

export const schema_field_comment: DeepPartial<Field> = {
    field: "comment",
    type: "uuid",
    meta: {
        collection: schema_collection_name,
        conditions: null,
        display: null,
        display_options: null,
        field: "comment",
        group: null,
        hidden: true,
        interface: "select-dropdown-m2o",
        note: null,
        options: {
            enableCreate: false,
            template: "{{item}}",
        },
        readonly: false,
        required: true,
        special: ["m2o"],
        translations: null,
        validation: null,
        validation_message: null,
        width: "full",
    },
    schema: {
        data_type: "uuid",
        foreign_key_column: "id",
        foreign_key_schema: "public",
        foreign_key_table: "directus_comments",
        has_auto_increment: false,
        is_generated: false,
        is_indexed: false,
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        max_length: null,
        name: "comment",
        numeric_precision: null,
        numeric_scale: null,
    },
};


export const field_relation = {
    collection:schema_collection_name,
    field:"field",
    related_collection:"directus_fields",
    meta: {
        sort_field:null
    },
    schema: {
        on_delete:"SET NULL"
    }
};

export const comment_relation = {
    collection:schema_collection_name,
    field:"comment",
    related_collection:"directus_comments",
    meta: {
        sort_field:null
    },
    schema: {
        on_delete:"SET NULL"
    }
};