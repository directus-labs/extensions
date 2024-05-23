<template>
    <div ref="target" :tabindex="editMode && tabPress ? null : 0" class="spreadsheet-cell"
        :class="{ 'edit-mode': editMode }" @dblclick="enterCell">
        <slot v-if="editMode" name="interface" />
        <slot v-else name="display" :display-item="mergedItemWithEdits" />

        <div v-if="!editMode && fieldHasEdits" v-tooltip="t('unsaved_changes')" class="edit-dot"></div>
    </div>
</template>



<script setup lang="ts">
    import { nextTick, ref, computed, type Ref } from 'vue'
    import { useI18n } from 'vue-i18n';
    import { onKeyStroke, onClickOutside } from '@vueuse/core'

    const props = defineProps<{
        column: number;
        item: any;
        fieldKey: string;
        fieldEdits?: any;
    }>();

    const emit = defineEmits(['leaveCell']);

    const target = ref(null);

    const { editMode, enterCell, leaveCell } = useEditMode({
        onFocusCell() {
            ((target.value! as HTMLElement)?.querySelector('.v-input') as HTMLElement)?.click();
        }
    });

    const { tabPress } = useCellNavigation(editMode, enterCell, leaveCell);

    const { t } = useI18n();
    const { fieldHasEdits, mergedItemWithEdits } = useDisplayEdits();

    function useEditMode({ onFocusCell }: any) {
        const editMode = ref(false);

        onKeyStroke('Enter', enterCell, { target });
        onKeyStroke(['Esc', 'Escape'], leaveCellAndFocus);
        onClickOutside(target, clickOutside);

        return { editMode, enterCell, leaveCell };

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

    function useCellNavigation(preventNavigation: Ref<boolean>, enterCell: any, leaveCell: any) {
        onKeyStroke(['Left', 'ArrowLeft'], (e) => cellNavigation(e, {}), { target });
        onKeyStroke(['Right', 'ArrowRight'], (e) => cellNavigation(e, { next: true }), { target });
        onKeyStroke(['Up', 'ArrowUp'], (e) => cellNavigation(e, { vertical: true }), { target });
        onKeyStroke(['Down', 'ArrowDown'], (e) => cellNavigation(e, { vertical: true, next: true }), { target });

        const tabPress = ref(false);
        onKeyStroke('Tab', () => tabPress.value = true);
        onKeyStroke('Tab', () => tabPress.value = false, { eventName: 'keyup' });

        onKeyStroke('Tab', (e) => {
            e.preventDefault();
            leaveCell();
            cellNavigation(e, { next: e.shiftKey ? false : true });
        }, { target });

        onKeyStroke('Tab', (e) => {
            e.preventDefault();
            enterCell();
        }, { target, eventName: 'keyup' });

        return { tabPress };

        function cellNavigation(e: KeyboardEvent, { vertical = false, next = false }) {
            if (preventNavigation.value) return;

            e.preventDefault();

            const parent = vertical ? 'tr.table-row' : 'td.cell';
            const parentSibling = (e.target as HTMLElement)?.closest(parent)?.[next ? 'nextElementSibling' : 'previousElementSibling'];
            const cell = vertical
                ? parentSibling?.querySelectorAll('.spreadsheet-cell')?.[props.column]
                : parentSibling?.querySelector('.spreadsheet-cell');

            (cell as HTMLElement)?.focus()
        }
    }

    function useDisplayEdits() {
        const fieldHasEdits = computed(() => typeof props.fieldEdits !== 'undefined');

        const mergedItemWithEdits = computed(() => {
            if (!fieldHasEdits.value) return props.item;

            return {
                ...props.item,
                [props.fieldKey]: props.fieldEdits
            };
        });

        return { fieldHasEdits, mergedItemWithEdits };
    }
</script>



<style lang="scss">
    .spreadsheet-cell {
        --v-input-border-radius: 0;

        .v-checkbox.block {
            --theme--border-radius: 0;
        }
    }
</style>

<style lang="scss" scoped>
    .spreadsheet-cell {
        display: flex;
        align-items: center;
        position: relative;
        margin-left: calc(-1 * var(--theme--border-width));
        margin-right: calc(-1 * var(--theme--border-width));
        width: calc(100% + var(--theme--border-width) * 2);
        height: calc(100% + var(--theme--border-width) * 2);

        > :deep(.v-input) {
            --v-input-border-radius: 0;
        }

        &:not(.edit-mode) {
            overflow: hidden;
            text-align: inherit;
            justify-content: inherit;
            white-space: nowrap;
            text-overflow: ellipsis;
            border: var(--theme--border-width) solid transparent;

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

        &:focus {
            .edit-dot {
                display: none;
            }
        }

        .edit-dot {
            position: absolute;
            left: 1px;
            top: 50%;
            margin-top: -2px;
            display: block;
            width: 4px;
            height: 4px;
            border-radius: 4px;
            background-color: var(--theme--foreground-subdued);
        }
    }
</style>