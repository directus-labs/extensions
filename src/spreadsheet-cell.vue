<template>
    <div ref="target" tabindex="0" class="spreadsheet-cell" :class="{ 'edit-mode': editMode }" @dblclick="enterCell">
        <slot v-if="editMode" name="interface" />
        <slot v-else name="display" />
    </div>
</template>



<script setup lang="ts">
    import { ref, type Ref } from 'vue'
    import { onKeyStroke, onClickOutside } from '@vueuse/core'

    const props = defineProps<{ column: number }>();

    const target = ref(null);

    const { editMode, enterCell } = useEditMode();
    useCellNavigation(editMode);

    function useEditMode() {
        const editMode = ref(false);

        onKeyStroke('Enter', enterCell, { target });
        onKeyStroke(['Esc', 'Escape'], leaveCellAndFocus, { target });
        onClickOutside(target, leaveCell);

        return { editMode, enterCell };

        function enterCell() {
            if (editMode.value) return;
            editMode.value = true;
        }

        function leaveCell() {
            if (!editMode.value) return;
            editMode.value = false;
        }

        function leaveCellAndFocus() {
            leaveCell();
            target.value?.focus();
        }
    }

    function useCellNavigation(preventNavigation: Ref<boolean>) {
        onKeyStroke(['Left', 'ArrowLeft'], (e) => cellNavigation(e, {}), { target });
        onKeyStroke(['Right', 'ArrowRight'], (e) => cellNavigation(e, { next: true }), { target });
        onKeyStroke(['Up', 'ArrowUp'], (e) => cellNavigation(e, { vertical: true }), { target });
        onKeyStroke(['Down', 'ArrowDown'], (e) => cellNavigation(e, { vertical: true, next: true }), { target });

        function cellNavigation(e: KeyboardEvent, { vertical = false, next = false }) {
            if (preventNavigation.value) return;

            const parent = vertical ? 'tr.table-row' : 'td.cell';
            const parentSibling = e.target?.closest(parent)?.[next ? 'nextElementSibling' : 'previousElementSibling'];
            const cell = vertical
                ? parentSibling?.querySelectorAll(`.spreadsheet-cell`)?.[props.column]
                : parentSibling?.querySelector('.spreadsheet-cell');

            cell?.focus()
        }
    }
</script>



<style lang="scss" scoped>
    .spreadsheet-cell {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;

        &:not(.edit-mode) {
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            border: var(--theme--border-width) solid transparent;
            border-radius: var(--v-input-border-radius, var(--theme--border-radius));

            &:hover {
                border-color: var(--theme--border-color-subdued);
            }

            &:focus,
            &:focus-within {
                border-color: var(--theme--primary);
            }
        }

        &:not(.edit-mode),
        & :deep(.v-input .input) {
            padding: calc(8px - var(--theme--border-width)) calc(12px - var(--theme--border-width));
        }

        & :deep(.v-input) {
            min-height: 100%;
        }
    }
</style>