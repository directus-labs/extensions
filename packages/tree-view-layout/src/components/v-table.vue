<script setup lang="ts">
    import type { ShowSelect } from "@directus/extensions";

    import type { PrimaryKey } from "@directus/types";
    import { clone, forEach, pick, cloneDeep } from "lodash";
    import {
        computed,
        ref,
        useSlots,
        toRef,
        watch,
        type Ref,
        type ComputedRef,
    } from "vue";
    import Sortable from "./sortable/sortable.vue";
    import TableHeader from "./table-header.vue";
    import TableRow from "./table-row.vue";
    import { useSessionStorage } from "@vueuse/core";
    import {
        Header,
        HeaderRaw,
        Item,
        ItemSelectEvent,
        Sort,
    } from "../core-clones/components/v-table/types";
    // CORE CHANGES
    // import { i18n } from "@/lang";
    // import { hideDragImage } from '@/utils/hide-drag-image';
    // import { Header, HeaderRaw, Item, ItemSelectEvent, Sort } from "./types";

    const HeaderDefaults: Header = {
        text: "",
        value: "",
        align: "left",
        sortable: true,
        width: null,
        description: null,
    };

    const props = withDefaults(
        defineProps<{
            headers: HeaderRaw[];
            items: Item[];
            itemKey?: string;
            sort?: Sort | null;
            mustSort?: boolean;
            showSelect?: ShowSelect;
            showResize?: boolean;
            showManualSort?: boolean;
            manualSortKey?: string;
            allowHeaderReorder?: boolean;
            modelValue?: any[];
            fixedHeader?: boolean;
            loading?: boolean;
            loadingText?: string;
            noItemsText?: string;
            rowHeight?: number;
            selectionUseKeys?: boolean;
            inline?: boolean;
            disabled?: boolean;
            clickable?: boolean;
            parentField: string | null;
            collection: string;
        }>(),
        {
            itemKey: "id",
            sort: undefined,
            mustSort: false,
            showSelect: "none",
            showResize: false,
            showManualSort: false,
            manualSortKey: undefined,
            allowHeaderReorder: false,
            modelValue: () => [],
            fixedHeader: false,
            loading: false,
            // CORE CHANGE
            // loadingText: i18n.global.t("loading"),
            // noItemsText: i18n.global.t("no_items"),
            rowHeight: 48,
            selectionUseKeys: false,
            inline: false,
            disabled: false,
            clickable: true,
        }
    );

    const emit = defineEmits([
        "click:row",
        "update:sort",
        "item-selected",
        "update:modelValue",
        "update:headers",
        "update:items",
    ]);

    const slots = useSlots();

    const internalHeaders = computed({
        get: () => {
            return props.headers
                .map((header: HeaderRaw) => ({
                    ...HeaderDefaults,
                    ...header,
                }))
                .map((header) => {
                    if (header.width && header.width < 24) {
                        header.width = 24;
                    }

                    return header;
                });
        },
        set: (newHeaders: Header[]) => {
            emit(
                "update:headers",
                // We'll return the original headers with the updated values, so we don't stage
                // all the default values
                newHeaders.map((header) => {
                    const keysThatAreNotAtDefaultValue: string[] = [];

                    forEach(header, (value, key: string) => {
                        const objKey = key as keyof Header;

                        if (value !== HeaderDefaults[objKey]) {
                            keysThatAreNotAtDefaultValue.push(key);
                        }
                    });

                    return pick(header, keysThatAreNotAtDefaultValue);
                })
            );
        },
    });

    // In case the sort prop isn't used, we'll use this local sort state as a fallback.
    // This allows the table to allow inline sorting on column out of the box without the need for
    const internalSort = computed<Sort>(
        () =>
            props.sort ?? {
                by: null,
                desc: false,
            }
    );

    const reordering = ref<boolean>(false);

    const hasHeaderAppendSlot = computed(
        () => slots["header-append"] !== undefined
    );
    const hasHeaderContextMenuSlot = computed(
        () => slots["header-context-menu"] !== undefined
    );
    const hasItemAppendSlot = computed(
        () => slots["item-append"] !== undefined
    );

    const fullColSpan = computed<string>(() => {
        let length = internalHeaders.value.length + 1; // +1 account for spacer
        if (props.showSelect !== "none") length++;
        if (props.showManualSort) length++;
        if (hasItemAppendSlot.value) length++;

        return `1 / span ${length}`;
    });

    const allItemsSelected = computed<boolean>(() => {
        return (
            props.loading === false &&
            props.items.length > 0 &&
            props.modelValue.length === props.items.length
        );
    });

    const someItemsSelected = computed<boolean>(() => {
        return props.modelValue.length > 0 && allItemsSelected.value === false;
    });

    function onItemSelected(event: ItemSelectEvent) {
        if (props.disabled) return;

        emit("item-selected", event);

        let selection = clone(props.modelValue) as any[];

        if (event.value === true) {
            if (props.selectionUseKeys) {
                selection.push(event.item[props.itemKey]);
            } else {
                selection.push(event.item);
            }
        } else {
            selection = selection.filter((item) => {
                if (props.selectionUseKeys) {
                    return item !== event.item[props.itemKey];
                }

                return item[props.itemKey] !== event.item[props.itemKey];
            });
        }

        if (props.showSelect === "one") {
            selection = selection.slice(-1);
        }

        emit("update:modelValue", selection);
    }

    function getSelectedState(item: Item) {
        const selectedKeys = props.selectionUseKeys
            ? props.modelValue
            : props.modelValue.map((item) => item[props.itemKey]);

        return selectedKeys.includes(item[props.itemKey]);
    }

    function onToggleSelectAll(value: boolean) {
        if (props.disabled) return;

        if (value === true) {
            if (props.selectionUseKeys) {
                emit(
                    "update:modelValue",
                    clone(props.items).map((item) => item[props.itemKey])
                );
            } else {
                emit("update:modelValue", clone(props.items));
            }
        } else {
            emit("update:modelValue", []);
        }
    }

    function updateSort(newSort: Sort) {
        emit("update:sort", newSort?.by ? newSort : null);
    }

    const controlColumnPadding = 12;
    const controlIconWidth = 28;
    const controlIconWidthCSS = `${controlIconWidth}px`;

    const columnStyle = computed<{ header: string; rows: string }>(() => {
        return {
            header: generate("auto"),
            rows: generate(),
        };

        function generate(useVal?: "auto") {
            let gridTemplateColumns = internalHeaders.value
                .map((header) => {
                    return header.width
                        ? useVal ?? `${header.width}px`
                        : "160px";
                })
                .reduce((acc, val) => (acc += " " + val), "");
            const controlColumnWidth = getControlColumnWidth();

            if (!!controlColumnWidth)
                gridTemplateColumns = `${controlColumnWidth}px ${gridTemplateColumns}`;

            gridTemplateColumns = gridTemplateColumns + " 1fr";

            if (hasItemAppendSlot.value || hasHeaderAppendSlot.value)
                gridTemplateColumns += " min-content";

            return gridTemplateColumns;
        }

        function getControlColumnWidth() {
            let controlColumnWidth = 0;

            if (props.showSelect !== "none")
                controlColumnWidth += controlIconWidth;

            if (props.showManualSort) controlColumnWidth += controlIconWidth;

            if (!!gridTemplateTreeColumnWidth.value)
                controlColumnWidth += gridTemplateTreeColumnWidth.value;

            if (!!controlColumnWidth)
                controlColumnWidth += controlColumnPadding;

            return controlColumnWidth;
        }
    });

    const internalItems = ref(props.items);
    watch(
        () => props.items,
        (newItems) => (internalItems.value = newItems)
    );

    const sortIsManual = computed(
        () => internalSort.value.by === props.manualSortKey
    );

    const {
        gridTemplateTreeColumnWidth,
        depthChangeMax,
        itemDepth,
        itemParent,
        childrenKey,
        collapsedKey,
        collapsedParentsKey,
        onSortUpdate,
        onToggleChildren,
    } = useTreeView({
        internalItems,
        parentField: toRef(props, "parentField"),
        itemKey: toRef(props, "itemKey"),
        sortKey: toRef(props, "manualSortKey"),
        showManualSort: toRef(props, "showManualSort"),
        collection: toRef(props, "collection"),
        sortIsManual,
        controlIconWidth,
    });

    function useTreeView({
        internalItems,
        parentField,
        itemKey,
        sortKey,
        showManualSort,
        collection,
        sortIsManual,
        controlIconWidth,
    }: {
        internalItems: Ref<Item[]>;
        parentField: Ref<string | null>;
        itemKey: Ref<string>;
        sortKey: Ref<string | undefined>;
        showManualSort: Ref<boolean>;
        collection: Ref<string>;
        sortIsManual: ComputedRef<boolean>;
        controlIconWidth: number;
    }) {
        const itemDepth = "--depth";
        const itemParent = "--parentId";
        const treeViewAble = computed(isTreeViewAble);
        const depthChangeMax = ref(0);
        const maxDepths = computed(getMaxDepths);
        const gridTemplateTreeColumnWidth = computed(calculateColumnWidth);
        const {
            childrenKey,
            collapsedKey,
            collapsedParentsKey,
            onToggleChildren,
            isCollapsed,
            initCollapsedChildren,
        } = useCollapsible();

        watch(() => props.items, initTreeView, { immediate: true });
        watch(() => treeViewAble.value, initTreeView);
        watch(() => parentField.value, initTreeView);

        watch(() => parentField.value, resetIfNoParentSelected);

        return {
            gridTemplateTreeColumnWidth,
            depthChangeMax,
            itemDepth,
            itemParent,
            childrenKey,
            collapsedKey,
            collapsedParentsKey,
            onSortUpdate,
            onToggleChildren,
        };

        function resetIfNoParentSelected(
            newParentField: string | null,
            oldParentField: string | null
        ) {
            if (!newParentField && !!oldParentField)
                internalItems.value = props.items;
        }

        function initTreeView() {
            if (treeViewAble.value) {
                const { sortedResult, orderChanged } = reorder(
                    calculateTreeProps(cloneDeep(internalItems.value))
                );
                internalItems.value = sortedResult;
                initCollapsedChildren();

                if (orderChanged) onSortUpdate({ sort: true, parent: null });
            }
        }

        function isTreeViewAble() {
            return (
                !!internalItems.value?.length &&
                !!parentField.value &&
                showManualSort.value &&
                !!sortKey.value &&
                sortIsManual.value
            );
        }

        function calculateColumnWidth() {
            return maxDepths.value * controlIconWidth;
        }

        function getMaxDepths() {
            return Math.max(
                ...internalItems.value.map((item) => item[itemDepth] ?? 0),
                depthChangeMax.value
            );
        }

        /** Calculates `[itemDepth]`, `[itemParent]` (id) and `[childrenKey]` */
        function calculateTreeProps(data: Item[]) {
            const map = {};

            data.forEach((item) => {
                item[itemParent] = getParentId(item);
                item[childrenKey] = [];
                item[collapsedKey] = isCollapsed(item[itemKey.value]);
                item[collapsedParentsKey] = [];

                map[item[itemKey.value]] = item;
            });

            for (const key in map) {
                const item = map[key];
                if (!(itemDepth in item)) setDepth(item);
            }

            return Object.values(map) as Item[];

            function getParentId(item: Item) {
                if (!parentField.value) return null;

                return (
                    item[parentField.value]?.[itemKey.value] ??
                    item[parentField.value]
                );
            }

            function setDepth(item) {
                if (item[itemParent]) {
                    const parentId = item[itemParent];

                    if (map[parentId]) {
                        const parentItem = map[parentId];

                        if (!(itemDepth in parentItem)) {
                            setDepth(parentItem);
                        }

                        item[itemDepth] = parentItem[itemDepth] + 1;
                    }
                } else {
                    item[itemDepth] = 0;
                }
            }
        }

        function reorder(items: Item[]) {
            let sortedResult: Item[] = [];
            let orderChanged = false;

            const rootItems = items.filter((item) => item[itemDepth] === 0);
            rootItems.sort(sortBySortKey);
            rootItems.forEach(addItem);
            applySortValues();

            return { sortedResult, orderChanged };

            function applySortValues() {
                sortedResult = sortedResult.map((item: Item, index) => {
                    const sortValue = index + 1;

                    if (item[sortKey.value!] !== sortValue) {
                        item[sortKey.value!] = sortValue;
                        if (!orderChanged) orderChanged = true;
                    }

                    return item;
                });
            }

            function addItem(item: Item) {
                sortedResult.push(item);

                const children = items.filter(
                    (child) => child[itemParent] === item[itemKey.value]
                );

                children.sort(sortBySortKey);
                children.forEach((child) => {
                    item[childrenKey].push(child[itemKey.value]);
                    const childrenIds = addItem(child);
                    item[childrenKey].push(...childrenIds);
                });

                return item[childrenKey];
            }

            function sortBySortKey(a: Item, b: Item): number {
                return a[sortKey.value!] - b[sortKey.value!];
            }
        }

        type SortUpdateParams = {
            sort: boolean;
            parent: null | { id: PrimaryKey; parent: PrimaryKey | null };
        };

        function onSortUpdate({ sort, parent }: SortUpdateParams) {
            let edits = {};

            if (sort) {
                internalItems.value.forEach((item) => {
                    edits[item[props.itemKey]] = {
                        [props.manualSortKey!]: item[props.manualSortKey!],
                    };
                });
            }

            if (parent && parentField.value) {
                edits = {
                    ...edits,
                    [parent.id]: {
                        ...edits[parent.id],
                        [parentField.value]:
                            parent.parent !== null
                                ? { [itemKey.value]: parent.parent }
                                : null,
                    },
                };
            }

            emit("update:items", edits);
        }

        function useCollapsible() {
            const childrenKey = "--children";
            const collapsedKey = "--collapsed";
            const collapsedParentsKey = "--collapsed-parents";
            const collapsedState = useSessionStorage<PrimaryKey[]>(
                `${collection.value}--tree-view-collapsed-items`,
                []
            );

            return {
                childrenKey,
                collapsedKey,
                collapsedParentsKey,
                onToggleChildren,
                isCollapsed,
                initCollapsedChildren,
            };

            function isCollapsed(id: PrimaryKey) {
                return collapsedState.value.includes(id);
            }

            function onToggleChildren(item: Item) {
                if (!item[childrenKey]?.length) return;

                item[collapsedKey] = toggleItem(item[itemKey.value]);
                collapseChildren(item[itemKey.value], item[childrenKey]);
            }

            function toggleItem(id: PrimaryKey): boolean {
                const index = collapsedState.value.indexOf(id);

                if (index > -1) {
                    collapsedState.value.splice(index, 1);
                    return false;
                }

                collapsedState.value.push(id);
                return true;
            }

            function initCollapsedChildren() {
                collapsedState.value.forEach((collapsedId: PrimaryKey) => {
                    const childrenIds = internalItems.value?.find(
                        (item) => item[itemKey.value] === collapsedId
                    )?.[childrenKey];

                    collapseChildren(collapsedId, childrenIds);
                });
            }

            function collapseChildren(
                id: PrimaryKey,
                childrenIds: PrimaryKey[]
            ) {
                internalItems.value
                    .filter((internalItem) =>
                        childrenIds.includes(internalItem[itemKey.value])
                    )
                    .forEach((childItem) => {
                        const parentIndex =
                            childItem[collapsedParentsKey]?.indexOf(id);

                        if (parentIndex > -1) {
                            childItem[collapsedParentsKey].splice(
                                parentIndex,
                                1
                            );
                        } else {
                            childItem[collapsedParentsKey].push(id);
                        }
                    });
            }
        }
    }
</script>

<template>
    <div
        class="v-table"
        :class="{ loading, inline, disabled }"
    >
        <table
            :summary="internalHeaders.map((header) => header.text).join(', ')"
        >
            <table-header
                v-model:headers="internalHeaders"
                v-model:reordering="reordering"
                :sort="internalSort"
                :show-select="showSelect"
                :show-resize="showResize"
                :some-items-selected="someItemsSelected"
                :all-items-selected="allItemsSelected"
                :fixed="fixedHeader"
                :show-manual-sort="showManualSort"
                :must-sort="mustSort"
                :has-item-append-slot="hasItemAppendSlot"
                :manual-sort-key="manualSortKey"
                :allow-header-reorder="allowHeaderReorder"
                @toggle-select-all="onToggleSelectAll"
                @update:sort="updateSort"
            >
                <template
                    v-for="header in internalHeaders"
                    #[`header.${header.value}`]
                >
                    <slot
                        :header="header"
                        :name="`header.${header.value}`"
                    />
                </template>

                <template
                    v-if="hasHeaderAppendSlot"
                    #header-append
                >
                    <slot name="header-append" />
                </template>

                <template
                    v-if="hasHeaderContextMenuSlot"
                    #header-context-menu="{ header }"
                >
                    <slot
                        name="header-context-menu"
                        v-bind="{ header }"
                    />
                </template>
            </table-header>
            <thead
                v-if="loading"
                class="loading-indicator"
                :class="{ sticky: fixedHeader }"
            >
                <tr>
                    <th
                        scope="colgroup"
                        :style="{ gridColumn: fullColSpan }"
                    >
                        <v-progress-linear
                            v-if="loading"
                            indeterminate
                        />
                    </th>
                </tr>
            </thead>
            <tbody v-if="loading && items.length === 0">
                <tr class="loading-text">
                    <td :style="{ gridColumn: fullColSpan }">
                        {{ loadingText ?? $t("loading") }}
                    </td>
                </tr>
            </tbody>
            <tbody v-if="!loading && items.length === 0">
                <tr class="no-items-text">
                    <td :style="{ gridColumn: fullColSpan }">
                        {{ noItemsText || $t("no_items") }}
                    </td>
                </tr>
            </tbody>
            <tbody v-else>
                <sortable
                    v-model:items="internalItems"
                    v-model:depth-change-max="depthChangeMax"
                    :item-key
                    :item-sort="manualSortKey"
                    :item-depth
                    :item-parent="!!parentField ? itemParent : null"
                    :snap-step="controlIconWidth"
                    :disabled="disabled || !sortIsManual"
                    v-slot="{
                        item,
                        selected: isSorting,
                        parentSelected: parentSorting,
                        onDragOver,
                        currentDepth,
                    }"
                    @manual-sort="onSortUpdate"
                >
                    <table-row
                        @mouseover.prevent="onDragOver"
                        :item
                        :indent="currentDepth * controlIconWidth"
                        :sorting="isSorting || parentSorting"
                        :has-children="item[childrenKey]?.length"
                        :children-collapsed="item[collapsedKey]"
                        :collapsed="!!item[collapsedParentsKey]?.length"
                        @toggle-children="onToggleChildren(item)"
                        :headers="internalHeaders"
                        :show-select="disabled ? 'none' : showSelect"
                        :show-manual-sort="!disabled && showManualSort"
                        :is-selected="getSelectedState(item)"
                        :subdued="loading || reordering"
                        :sorted-manually="sortIsManual"
                        :has-click-listener="!disabled && clickable"
                        :height="rowHeight"
                        @click="
                            !disabled && clickable
                                ? $emit('click:row', { item, event: $event })
                                : null
                        "
                        @item-selected="
                            onItemSelected({
                                item,
                                value: !getSelectedState(item),
                            })
                        "
                    >
                        <template
                            v-for="header in internalHeaders"
                            #[`item.${header.value}`]
                        >
                            <slot
                                :item="item"
                                :name="`item.${header.value}`"
                            />
                        </template>

                        <template
                            v-if="hasItemAppendSlot"
                            #item-append
                        >
                            <slot
                                name="item-append"
                                :item
                            />
                        </template>
                    </table-row>
                </sortable>
            </tbody>
        </table>
        <slot name="footer" />
    </div>
</template>

<style scoped>
    /*

	Available Variables:

		--v-table-sticky-offset-top  [0]
		--v-table-color              [var(--theme--foreground)]
		--v-table-background-color   [transparent]

*/

    .v-table {
        position: relative;
        height: auto;
        overflow-y: auto;
    }

    table {
        min-width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
    }

    table tbody {
        --grid-columns: v-bind(columnStyle.rows);

        display: contents;
    }

    table :deep(thead) {
        --grid-columns: v-bind(columnStyle.header);

        display: contents;
    }

    table :deep(td),
    table :deep(th) {
        color: var(--v-table-color, var(--theme--foreground));
    }

    table :deep(tr),
    table :deep(.loading-indicator) {
        display: grid;
        grid-template-columns: var(--grid-columns);
    }

    table :deep(td.align-left),
    table :deep(th.align-left) {
        text-align: left;
        justify-content: start;
    }

    table :deep(td.align-center),
    table :deep(th.align-center) {
        text-align: center;
        justify-content: center;
    }

    table :deep(td.align-right),
    table :deep(th.align-right) {
        text-align: right;
        justify-content: end;
    }

    table :deep(.loading-indicator) {
        position: relative;
        z-index: 3;
    }

    table :deep(.loading-indicator > th) {
        margin-right: var(--content-padding);
    }

    table :deep(.sortable-ghost .cell) {
        background-color: var(--theme--background-subdued);
    }

    .loading table {
        pointer-events: none;
    }

    .loading .loading-indicator {
        height: auto;
        padding: 0;
        border: none;
    }

    .loading .loading-indicator .v-progress-linear {
        --v-progress-linear-height: 2px;
        --v-progress-linear-color: var(
            --theme--form--field--input--border-color-hover
        );

        position: absolute;
        top: -2px;
        left: 0;
        width: 100%;
    }

    .loading .loading-indicator th {
        padding: 0;
    }

    .loading .loading-indicator.sticky th {
        position: sticky;
        top: 48px;
        z-index: 2;
    }

    .loading-text,
    .no-items-text {
        text-align: center;
        background-color: var(--theme--form--field--input--background);
    }

    .loading-text td,
    .no-items-text td {
        padding: 16px;
        color: var(--theme--foreground-subdued);
    }

    .inline {
        border: var(--theme--border-width) solid
            var(--theme--form--field--input--border-color);
        border-radius: var(--theme--border-radius);
    }

    .inline table :deep(.table-row:last-of-type .cell) {
        border-bottom: none;
    }

    .disabled {
        --v-table-color: var(--theme--foreground-subdued);
        --v-table-background-color: var(--theme--background-subdued);
    }

    table {
        border-bottom: var(--theme--border-width) solid
            var(--theme--border-color-subdued);
    }

    table :deep(.cell.controls .manual),
    table :deep(.cell.controls .select),
    table :deep(.cell.controls .collapse) {
        margin: 0 2px;
    }
    table :deep(.depth-spacer) {
        width: v-bind(controlIconWidthCSS);
    }
</style>
