<script setup lang="ts">
    import { computed } from "vue";
    import { useI18n } from "vue-i18n";
    import type { Field } from "@directus/types";
    // CORE CHANGES
    // import { useSync } from '@directus/composables';
    import { useSync } from "@directus/extensions-sdk";

    interface Props {
        fields: string[];
        activeFields: Field[];
        tableSpacing: "compact" | "cozy" | "comfortable";
        parentField: string | null;
        sortField: string;
        collection: string;
        fieldsInCollection: any;
        tableSort: { by: string; desc: boolean } | null;
    }

    const props = defineProps<Props>();

    const emit = defineEmits([
        "update:tableSpacing",
        "update:parentField",
        "update:activeFields",
        "update:fields",
    ]);

    const { t } = useI18n();

    const tableSpacingWritable = useSync(props, "tableSpacing", emit);
    const parentFieldWritable = useSync(props, "parentField", emit);

    const selfReferencingM2oFields = computed(() => {
        return props.fieldsInCollection?.filter(
            (field: Field) =>
                ["string", "integer"].includes(field.type) &&
                field.meta?.special?.includes("m2o") &&
                field.schema?.foreign_key_table == props.collection
        );
    });
</script>

<template>
    <div
        v-if="!sortField"
        class="field"
    >
        <v-notice type="warning"
            >Specify a sort field in your data model settings!</v-notice
        >
    </div>

    <div
        v-else
        class="field"
    >
        <div class="type-label">Parent (M2O)</div>

        <v-notice
            v-if="!selfReferencingM2oFields?.length"
            type="warning"
            >Create a M2O field that references this collection in your data
            model settings!</v-notice
        >

        <template v-else>
            <v-select
                v-model="parentFieldWritable"
                :items="selfReferencingM2oFields"
                item-text="name"
                item-value="field"
                show-deselect
                :placeholder="t('select_a_field')"
            />

            <small
                v-if="!parentFieldWritable"
                class="type-note"
                >Note that selecting a field can immediately update the sort
                values of your items!</small
            >

            <small
                v-if="parentFieldWritable && tableSort?.by !== sortField"
                class="type-note"
                >To use the Tree View Table features, be sure to click the
                <v-icon
                    name="sort"
                    small
                />
                button to enable manual sorting!</small
            >
        </template>
    </div>

    <div class="field">
        <div class="type-label">{{ t("layouts.tabular.spacing") }}</div>
        <v-select
            v-model="tableSpacingWritable"
            :items="[
                {
                    text: t('layouts.tabular.compact'),
                    value: 'compact',
                },
                {
                    text: t('layouts.tabular.cozy'),
                    value: 'cozy',
                },
                {
                    text: t('layouts.tabular.comfortable'),
                    value: 'comfortable',
                },
            ]"
        />
    </div>
</template>

<style lang="scss" scoped>
    .v-checkbox {
        width: 100%;

        .spacer {
            flex-grow: 1;
        }
    }

    .drag-handle {
        --v-icon-color: var(--theme--foreground-subdued);

        cursor: ns-resize;

        &:hover {
            --v-icon-color: var(--theme--foreground);
        }
    }

    .v-notice {
        --v-notice-background-color: var(--theme--background-accent);
    }
</style>
