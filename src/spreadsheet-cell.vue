<template>
    <div ref="target" tabindex="0" class="spreadsheet-cell" :class="{ 'edit-mode': editMode }" @dblclick="enterCell">
        <slot v-if="editMode" name="interface" />
        <slot v-else name="display" />
    </div>
</template>



<script setup lang="ts">
    import { nextTick, ref, type Ref } from 'vue'
    import { onKeyStroke, onClickOutside } from '@vueuse/core'

    const props = defineProps<{ column: number }>();

    const emit = defineEmits(['leaveCell']);

    const target = ref(null);

    const { editMode, enterCell } = useEditMode({
        onFocusCell() {
            ((target.value! as HTMLElement)?.querySelector('.v-input') as HTMLElement)?.click();
        }
    });

    useCellNavigation(editMode);

    function useEditMode({ onFocusCell }: any) {
        const editMode = ref(false);

        onKeyStroke('Enter', enterCell, { target });
        onKeyStroke(['Esc', 'Escape'], leaveCellAndFocus);
        onClickOutside(target, clickOutside);

        return { editMode, enterCell };

        function enterCell() {
            if (editMode.value) return;
            editMode.value = true;
            nextTick(onFocusCell);
        }

        function leaveCell() {
            if (!editMode.value) return;
            editMode.value = false;
            emit('leaveCell');
        }

        function leaveCellAndFocus() {
            if (!editMode.value) return;
            leaveCell();
            (target.value! as HTMLElement)?.focus();
        }

        function clickOutside(e: MouseEvent) {
            if (!editMode.value) return;
            const elementsToIgnore = (e.target as HTMLElement)?.closest('#dialog-outlet, #menu-outlet');
            if (elementsToIgnore) return;
            leaveCell();
        }
    }

    function useCellNavigation(preventNavigation: Ref<boolean>) {
        onKeyStroke(['Left', 'ArrowLeft'], (e) => cellNavigation(e, {}), { target });
        onKeyStroke(['Right', 'ArrowRight'], (e) => cellNavigation(e, { next: true }), { target });
        onKeyStroke(['Up', 'ArrowUp'], (e) => cellNavigation(e, { vertical: true }), { target });
        onKeyStroke(['Down', 'ArrowDown'], (e) => cellNavigation(e, { vertical: true, next: true }), { target });

        function cellNavigation(e: KeyboardEvent, { vertical = false, next = false }) {
            if (preventNavigation.value) return;

            e.preventDefault();

            const parent = vertical ? 'tr.table-row' : 'td.cell';
            const parentSibling = (e.target as HTMLElement)?.closest(parent)?.[next ? 'nextElementSibling' : 'previousElementSibling'];
            const cell = vertical
                ? parentSibling?.querySelectorAll(`.spreadsheet-cell`)?.[props.column]
                : parentSibling?.querySelector('.spreadsheet-cell');

            (cell as HTMLElement)?.focus()
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

        &.edit-mode :deep(.interface>*),
        &.edit-mode :deep(.v-input .input),
        &.edit-mode :deep(.v-checkbox) {
            border-color: var(--theme--primary);
        }

        &:not(.edit-mode),
        & :deep(.v-input .input) {
            padding: calc(8px - var(--theme--border-width)) calc(12px - var(--theme--border-width));
        }

        & :deep(.v-form),
        & :deep(.v-form > .field),
        & :deep(.v-form > .field > .interface) {
            height: 100%;
        }

        & :deep(.v-input),
        & :deep(.v-checkbox) {
            --theme--form--field--input--height: 38px;
            min-height: 100%;
        }

        & :deep(.v-form) {
            z-index: 1;
            width: 100%;
        }

        & :deep(.v-form) {
            min-width: 90px;
        }

        & :deep(.v-form .v-select .v-input) {
            min-width: 120px;
        }
    }
</style>