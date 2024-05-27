<template>
    <div class="layout-spreadsheet">
        <v-table v-if="loading || (itemCount && itemCount > 0 && !error)" ref="table" v-model="selectionWritable"
            v-model:headers="tableHeadersWritable" class="table" fixed-header
            :show-select="showSelect ? showSelect : selection !== undefined" show-resize must-sort :sort="tableSort"
            :items="items" :loading="loading" :item-key="primaryKeyField?.field" :show-manual-sort="sortAllowed"
            :manual-sort-key="sortField" allow-header-reorder selection-use-keys :clickable="false"
            @update:sort="onSortChange" @manual-sort="changeManualSort">

            <template #header-context-menu="{ header }">
                <v-list>
                    <v-list-item :disabled="!header.sortable"
                        :active="tableSort?.by === header.value && tableSort?.desc === false" clickable
                        @click="onSortChange({ by: header.value, desc: false })">
                        <v-list-item-icon>
                            <v-icon name="sort" class="flip" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('sort_asc') }}
                        </v-list-item-content>
                    </v-list-item>

                    <v-list-item :active="tableSort?.by === header.value && tableSort?.desc === true"
                        :disabled="!header.sortable" clickable @click="onSortChange({ by: header.value, desc: true })">
                        <v-list-item-icon>
                            <v-icon name="sort" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('sort_desc') }}
                        </v-list-item-content>
                    </v-list-item>

                    <v-divider />

                    <v-list-item :active="header.align === 'left'" clickable
                        @click="onAlignChange?.(header.value, 'left')">
                        <v-list-item-icon>
                            <v-icon name="format_align_left" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('left_align') }}
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item :active="header.align === 'center'" clickable
                        @click="onAlignChange?.(header.value, 'center')">
                        <v-list-item-icon>
                            <v-icon name="format_align_center" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('center_align') }}
                        </v-list-item-content>
                    </v-list-item>
                    <v-list-item :active="header.align === 'right'" clickable
                        @click="onAlignChange?.(header.value, 'right')">
                        <v-list-item-icon>
                            <v-icon name="format_align_right" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('right_align') }}
                        </v-list-item-content>
                    </v-list-item>

                    <v-divider />

                    <v-list-item :active="header.align === 'right'" clickable @click="removeField(header.value)">
                        <v-list-item-icon>
                            <v-icon name="remove" />
                        </v-list-item-icon>
                        <v-list-item-content>
                            {{ t('hide_field') }}
                        </v-list-item-content>
                    </v-list-item>
                </v-list>
            </template>

            <template #header-append>
                <v-menu placement="bottom-end" show-arrow :close-on-content-click="false">
                    <template #activator="{ toggle, active }">
                        <v-icon v-tooltip="t('add_field')" class="add-field" name="add" :class="{ active }" clickable
                            @click="toggle" />
                    </template>

                    <v-list>
                        <v-list-item v-for="field of allowedFields" :key="field.field" clickable
                            :disabled="fields.includes(field.field)" @click="addField(field.field)">
                            <v-list-item-content>
                                <v-text-overflow :text="field.name || formatTitle(field.field)" />
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>

            <template v-for="header, index in tableHeaders" :key="header.value" #[`item.${header.value}`]="{ item }">
                <spreadsheet-cell :column="index" @leaveCell="autoSaveEdits" :item="item" :field-key="header.value"
                    :field-edits="edits[item[primaryKeyField?.field]]?.[header.value]">
                    <template #display="{ displayItem }">
                        <render-display :value="getFromAliasedItem(displayItem, header.value)"
                            :display="header.field.display" :options="header.field.displayOptions"
                            :interface="header.field.interface" :interface-options="header.field.interfaceOptions"
                            :type="header.field.type" :collection="header.field.collection"
                            :field="header.field.field" />
                    </template>

                    <template #interface>
                        <v-form :fields="[header.field]" :initial-values="item"
                            v-model="editsWritable[item[primaryKeyField?.field]]" :loading="loading"
                            :primary-key="item[primaryKeyField?.field]" autofocus :show-validation-errors="false"
                            :show-no-visible-fields="false" :raw-editor-enabled="false" />
                    </template>
                </spreadsheet-cell>
            </template>

            <template #item-append="{ item }">
                <v-button :to="`/content/${collection}/${item[primaryKeyField?.field]}`" :tooltip="t('edit_item')" icon
                    secondary x-small>
                    <v-icon class="small" name="edit"></v-icon>
                </v-button>
            </template>

            <template #footer>
                <div class="footer">
                    <div class="pagination">
                        <v-pagination v-if="totalPages > 1" :length="totalPages" :total-visible="7" show-first-last
                            :model-value="page" @update:model-value="toPage" />
                    </div>

                    <div v-if="loading === false && (items.length >= 25 || limit < 25)" class="per-page">
                        <span>{{ t('per_page') }}</span>
                        <v-select :model-value="`${limit}`" :items="pageSizes" inline
                            @update:model-value="limitWritable = +$event" />
                    </div>
                </div>
            </template>
        </v-table>

        <v-info v-else-if="error" type="danger" :title="t('unexpected_error')" icon="error" center>
            {{ t('unexpected_error_copy') }}

            <template #append>
                <v-error :error="error" />

                <v-button small class="reset-preset" @click="resetPresetAndRefresh">
                    {{ t('reset_page_preferences') }}
                </v-button>
            </template>
        </v-info>

        <slot v-else-if="itemCount === 0 && (filterUser || search)" name="no-results" />
        <slot v-else-if="itemCount === 0" name="no-items" />
    </div>

    <v-dialog v-model="confirmLeave" @esc="confirmLeave = false">
        <v-card>
            <v-card-title>{{ t('unsaved_changes') }}</v-card-title>
            <v-card-text>{{ t('unsaved_changes_copy') }}</v-card-text>
            <v-card-actions>
                <v-button secondary @click="discardAndLeave">
                    {{ t('discard_changes') }}
                </v-button>
                <v-button @click="confirmLeave = false">{{ t('keep_editing') }}</v-button>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>



<script setup lang="ts">
    import { inject, ref, toRefs, watch, computed, type ComponentPublicInstance, type Ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import type { ShowSelect } from '@directus/extensions';
    import type { Field, Filter, Item } from '@directus/types';
    import { useRouter } from 'vue-router';
    import SpreadsheetCell from './spreadsheet-cell.vue'
    // CORE CLONES
    import { HeaderRaw } from './core-clones/components/v-table/types';
    import { AliasFields, useAliasFields } from './core-clones/composables/use-alias-fields';
    import { usePageSize } from './core-clones/composables/use-page-size';
    import { useEditsGuard } from './core-clones/composables/use-edits-guard';
    import { Collection } from './core-clones/types/collections';
    // CORE CHANGES
    // import { useShortcut } from './core-clones/composables/use-shortcut';
    // import { useSync } from '@directus/composables';
    // import { useCollectionPermissions } from '@/composables/use-permissions';
    import { useStores, useSync } from '@directus/extensions-sdk';

    defineOptions({ inheritAttrs: false });

    interface Props {
        collection: string;
        selection?: Item[];
        readonly: boolean;
        tableHeaders: HeaderRaw[];
        showSelect?: ShowSelect;
        items: Item[];
        loading: boolean;
        error?: any;
        totalPages: number;
        tableSort?: { by: string; desc: boolean } | null;
        tableRowHeight: number;
        page: number;
        toPage: (newPage: number) => void;
        itemCount?: number;
        fields: string[];
        allowedFields: Ref<{ field: string, name: string }[]>;
        limit: number;
        primaryKeyField?: Field;
        info?: Collection;
        sortField?: string;
        changeManualSort: (data: any) => Promise<void>;
        resetPresetAndRefresh: () => Promise<void>;
        selectAll: () => void;
        filterUser?: Filter;
        search?: string;
        aliasedFields: Record<string, AliasFields>;
        aliasedKeys: string[];
        onSortChange: (newSort: { by: string; desc: boolean }) => void;
        onAlignChange?: (field: 'string', align: 'left' | 'center' | 'right') => void;
        edits: Record<string, any>;
        hasEdits: boolean;
        autoSaveEdits: () => void;
        resetEdits: () => void;
    }

    const props = withDefaults(defineProps<Props>(), {
        selection: () => [],
        showSelect: 'none',
        error: null,
        itemCount: undefined,
        tableSort: undefined,
        primaryKeyField: undefined,
        info: undefined,
        sortField: undefined,
        filterUser: undefined,
        search: undefined,
        onAlignChange: () => undefined,
    });

    const emit = defineEmits(['update:selection', 'update:tableHeaders', 'update:limit', 'update:fields', 'update:edits']);

    const { t } = useI18n();
    const { collection } = toRefs(props);

    // CORE CHANGES
    const { sortAllowed } = useCollectionPermissions(collection);
    function useCollectionPermissions(collection: Ref<string>) {
        const { usePermissionsStore } = useStores();
        const permissionsStore = usePermissionsStore();

        return {
            sortAllowed: computed(() => {
                if (!props.sortField) return false;
                return permissionsStore.hasPermission(collection.value, 'sort');
            })
        }
    }

    const selectionWritable = useSync(props, 'selection', emit);
    const tableHeadersWritable = useSync(props, 'tableHeaders', emit);
    const limitWritable = useSync(props, 'limit', emit);

    const mainElement = inject<Ref<Element | undefined>>('main-element');

    const table = ref<ComponentPublicInstance>();

    watch(
        () => props.page,
        () => mainElement?.value?.scrollTo({ top: 0, behavior: 'smooth' }),
    );

    // CORE CHANGE
    // useShortcut(
    //     'meta+a',
    //     () => {
    //         props.selectAll();
    //     },
    //     table,
    // );

    const { sizes: pageSizes, selected: selectedSize } = usePageSize<string>(
        [25, 50, 100, 250, 500, 1000],
        (value) => String(value),
        props.limit,
    );

    if (limitWritable.value !== selectedSize) {
        limitWritable.value = selectedSize;
    }

    const fieldsWritable = useSync(props, 'fields', emit);

    const { getFromAliasedItem } = useAliasFields(fieldsWritable, collection);

    function addField(fieldKey: string) {
        fieldsWritable.value = [...fieldsWritable.value, fieldKey];
    }

    function removeField(fieldKey: string) {
        fieldsWritable.value = fieldsWritable.value.filter((field) => field !== fieldKey);
    }

    // CUSTOM

    const { cssHeight } = useCloneFromTableRowComponent();
    function useCloneFromTableRowComponent() {
        const cssHeight = computed(() => {
            return {
                tableRow: props.tableRowHeight + 2 + 'px',
                // renderTemplateImage: props.tableRowHeight - 16 + 'px',
            };
        });
        return { cssHeight }
    }

    const { columnStyle } = useCloneFromTableComponent();
    function useCloneFromTableComponent() {
        const columnStyle = computed<{ header: string; rows: string }>(() => {
            return {
                header: generate('auto'),
                rows: generate(),
            };

            function generate(useVal?: 'auto') {
                let gridTemplateColumns = tableHeadersWritable.value
                    .map((header) => {
                        return header.width ? useVal ?? `${header.width}px` : '160px';
                    })
                    .reduce((acc, val) => (acc += ' ' + val), '');

                if (props.showSelect !== 'none') gridTemplateColumns = '36px ' + gridTemplateColumns;
                if (sortAllowed.value) gridTemplateColumns = '36px ' + gridTemplateColumns;

                // DIFFERENT FROM ORIGINAL
                gridTemplateColumns += ' 0 1fr';

                return gridTemplateColumns;
            }
        });

        return { columnStyle };
    }

    const editsWritable = useSync(props, 'edits', emit);

    const { confirmLeave, discardAndLeave } = useConfirmLeave();
    function useConfirmLeave() {
        const router = useRouter();
        const { hasEdits } = toRefs(props);
        const { confirmLeave, leaveTo } = useEditsGuard(hasEdits, { compareQuery: ['version'] });

        return { confirmLeave, discardAndLeave };

        function discardAndLeave() {
            if (!leaveTo.value) return;
            props.resetEdits();
            confirmLeave.value = false;
            router.push(leaveTo.value);
        }
    }
</script>



<style lang="scss" scoped>
    .layout-spreadsheet {
        display: contents;
        margin: var(--content-padding);
        margin-bottom: var(--content-padding-bottom);
    }

    .v-table {
        & :deep(thead) {
            --grid-columns: v-bind(columnStyle.header);
        }

        & :deep(tbody) {
            --grid-columns: v-bind(columnStyle.rows);
        }

        & :deep(.append.cell) {
            position: sticky;
            right: 12px;
            background: var(--theme--background);
            overflow: visible;
            justify-content: flex-start;
            z-index: 2;
        }

        & :deep(.append.cell:after) {
            content: "";
            position: absolute;
            top: 0;
            left: 100%;
            bottom: 0;
            width: 12px;
            background: var(--theme--background);
        }

        & :deep(.table-header .append.cell) {
            padding-left: 12px !important;
        }

        & :deep(.cell.select),
        & :deep(.cell.manual:not(.append)) {
            padding-left: 0 !important;
        }

        & :deep(.table-row .cell),
        & :deep(.table-header .cell) {
            border-bottom: none;
        }

        & :deep(.table-header .cell:not(.select):not(.append):not(.manual):not(.spacer)) {
            border-bottom: calc(var(--theme--border-width) / 2) solid var(--theme--border-color-subdued);
        }

        & :deep(.table-row .cell:not(.select):not(.append):not(.manual):not(.spacer)) {
            border: calc(var(--theme--border-width) / 2) solid var(--theme--border-color-subdued);
        }

        & :deep(.table-row .cell.append) {
            border-left: calc(var(--theme--border-width) / 2) solid var(--theme--border-color-subdued);
        }

        & :deep(.table-row>.cell:nth-last-child(3)) {
            border-right: var(--theme--border-width) solid var(--theme--border-color-subdued) !important;
        }

        & :deep(.table-row:first-child .cell:not(.select):not(.append):not(.manual):not(.spacer)) {
            border-top: var(--theme--border-width) solid var(--theme--border-color-subdued);
        }

        & :deep(.table-row:last-child>.cell:not(.select):not(.append):not(.manual):not(.spacer)) {
            border-bottom: calc(var(--theme--border-width) * 1.5) solid var(--theme--border-color-subdued);
        }

        & :deep(.table-row>.cell:first-child:not(.manual):not(.select)),
        & :deep(.table-row>.cell.manual+.cell:not(.select)),
        & :deep(.table-row>.cell.select+.cell:not(.manual)) {
            border-left: calc(var(--theme--border-width) * 1.5) solid var(--theme--border-color-subdued) !important;
        }
    }

    .v-table>:deep(table tbody td.cell:not(.select):not(.append):not(.manual)) {
        width: 100%;
        height: 100%;
        padding: 0;
        overflow: visible;
        white-space: unset;
        text-overflow: unset;
    }

    .v-table>:deep(table tbody tr.table-row) {
        height: auto;
        min-height: v-bind('cssHeight.tableRow');
    }

    .v-table {
        --v-table-sticky-offset-top: var(--layout-offset-top);

        display: contents;

        &>:deep(table) {
            min-width: calc(100% - var(--content-padding)) !important;
            margin-left: var(--content-padding);
        }

        &>:deep(table tr) {
            margin-right: var(--content-padding);
        }

        &>:deep(table tbody td.append.cell) {
            padding-right: 0;
        }
    }

    .footer {
        position: sticky;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 32px var(--content-padding);

        .pagination {
            display: inline-block;
        }

        .per-page {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            width: 240px;
            color: var(--theme--foreground-subdued);

            span {
                width: auto;
                margin-right: 4px;
            }

            .v-select {
                color: var(--theme--foreground);
            }
        }
    }

    .reset-preset {
        margin-top: 24px;
    }

    .add-field {
        --v-icon-color-hover: var(--theme--foreground);

        &.active {
            --v-icon-color: var(--theme--foreground);
        }
    }

    .flip {
        transform: scaleY(-1);
    }
</style>
