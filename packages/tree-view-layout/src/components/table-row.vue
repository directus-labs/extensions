<script setup lang="ts">
    import type { ShowSelect } from "@directus/extensions";
    import { computed, inject, type Ref } from "vue";
    // CORE CHANGES
    // import type { Header, Item } from "./types";
    import type { Header, Item } from "../core-clones/components/v-table/types";

    const props = withDefaults(
        defineProps<{
            headers: Header[];
            item: Item;
            indent?: number;
            sorting?: boolean;
            hasChildren?: boolean;
            showSelect: ShowSelect;
            showManualSort?: boolean;
            isSelected?: boolean;
            subdued?: boolean;
            sortedManually?: boolean;
            hasClickListener?: boolean;
            height?: number;
        }>(),
        {
            indent: 0,
            showSelect: "none",
            showManualSort: false,
            isSelected: false,
            subdued: false,
            sortedManually: false,
            hasClickListener: false,
            height: 48,
        }
    );

    defineEmits(["click", "item-selected"]);

    const cssHeight = computed(() => {
        return {
            tableRow: props.height + 2 + "px",
            renderTemplateImage: props.height - 16 + "px",
        };
    });

    const { onSortStart, nestable } = inject("sortable") as {
        onSortStart: (item: Item, event: MouseEvent) => void;
        nestable: Ref<boolean>;
    };
</script>

<template>
    <tr
        class="table-row"
        :class="{ subdued: subdued, clickable: hasClickListener, sorting }"
        @click="$emit('click', $event)"
    >
        <td
            class="cell controls"
            :style="indent > 0 ? { paddingLeft: `${indent}px` } : null"
        >
            <div class="cell-style">
                <v-icon
                    v-if="showManualSort"
                    @click.stop
                    @mousedown.prevent="onSortStart(item, $event)"
                    name="drag_handle"
                    class="drag-handle manual"
                    :class="{ 'sorted-manually': sortedManually, nestable }"
                />

                <v-checkbox
                    v-if="showSelect !== 'none'"
                    @click.stop
                    class="select"
                    :icon-on="
                        showSelect === 'one'
                            ? 'radio_button_checked'
                            : undefined
                    "
                    :icon-off="
                        showSelect === 'one'
                            ? 'radio_button_unchecked'
                            : undefined
                    "
                    :model-value="isSelected"
                    @update:model-value="$emit('item-selected', $event)"
                />

                <v-icon
                    v-if="hasChildren"
                    @click.stop
                    name="expand_more"
                    class="collapse"
                />
            </div>
        </td>

        <td
            v-for="header in headers"
            :key="header.value"
            class="cell"
            :class="`align-${header.align}`"
        >
            <slot
                :name="`item.${header.value}`"
                :item="item"
            >
                <v-text-overflow
                    v-if="
                        header.value.split('.').reduce((acc, val) => {
                            return acc[val];
                        }, item)
                    "
                    :text="
                        header.value.split('.').reduce((acc, val) => {
                            return acc[val];
                        }, item)
                    "
                />
                <value-null v-else />
            </slot>
        </td>

        <td class="spacer cell" />
        <td
            v-if="$slots['item-append']"
            class="append cell"
            @click.stop
        >
            <slot name="item-append" />
        </td>
    </tr>
</template>

<style lang="scss" scoped>
    .table-row {
        height: v-bind("cssHeight.tableRow");

        .cell {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            background-color: var(--v-table-background-color, transparent);
            border-top: var(--theme--border-width) solid
                var(--theme--border-color-subdued);

            &:last-child {
                padding: 0 12px;
            }

            &.controls {
                padding: 0;
                display: flex;
                border-top: 0;

                .cell-style {
                    display: flex;
                    align-items: center;
                    flex-grow: 1;
                    height: 100%;
                    padding: 8px 0;
                    border-top: var(--theme--border-width) solid
                        var(--theme--border-color-subdued);
                }
            }
        }

        &.subdued .cell {
            opacity: 0.3;
        }

        &.clickable:not(.subdued):not(.sorting):hover .cell {
            background-color: var(--theme--background-subdued);
            cursor: pointer;

            &.controls {
                background-color: transparent;

                .cell-style {
                    background-color: var(--theme--background-subdued);
                }
            }
        }

        .drag-handle {
            --v-icon-color: var(--theme--foreground-subdued);

            &.sorted-manually {
                --v-icon-color: var(--theme--foreground);
                cursor: ns-resize;

                &.nestable {
                    cursor: move;
                }

                &:hover {
                    --v-icon-color: var(--theme--primary);
                }
            }
        }

        &.sorting:not(.subdued) .drag-handle {
            --v-icon-color: var(--theme--primary);
        }

        .collapse {
            --v-icon-color: var(--theme--foreground-subdued);

            &:hover {
                --v-icon-color: var(--theme--primary);
            }
        }

        .append {
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }

        :deep(.render-template) {
            height: v-bind("cssHeight.tableRow");

            img {
                height: v-bind("cssHeight.renderTemplateImage");
            }
        }
    }
</style>
