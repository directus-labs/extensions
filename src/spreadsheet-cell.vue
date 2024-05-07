<template>
    <div ref="target" class="spreadsheet-cell" tabindex="0">
        <slot />
    </div>
</template>



<script setup lang="ts">
    import { ref } from 'vue'
    import { onKeyStroke } from '@vueuse/core'

    const props = defineProps<{ column: number }>();


    const target = ref(null);

    useCellNavigation();

    function useCellNavigation() {
        onKeyStroke(['Esc', 'Escape'],
            (e) => e.target?.blur(),
            { target }
        );

        onKeyStroke(['Left', 'ArrowLeft'],
            (e) => e.target?.closest('td.cell')?.previousElementSibling?.querySelector('.spreadsheet-cell')?.focus(),
            { target }
        );

        onKeyStroke(['Right', 'ArrowRight'],
            (e) => e.target?.closest('td.cell')?.nextElementSibling?.querySelector('.spreadsheet-cell')?.focus(),
            { target }
        );

        onKeyStroke(['Up', 'ArrowUp'],
            (e) => e.target?.closest('tr.table-row')?.previousElementSibling?.querySelectorAll(`.spreadsheet-cell`)?.[props.column]?.focus(),
            { target }
        );

        onKeyStroke(['Down', 'ArrowDown'],
            (e) => e.target?.closest('tr.table-row')?.nextElementSibling?.querySelectorAll(`.spreadsheet-cell`)?.[props.column]?.focus(),
            { target }
        );
    }
</script>



<style lang="scss" scoped>
    .spreadsheet-cell {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: calc(8px - var(--theme--border-width)) calc(12px - var(--theme--border-width));
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        border: var(--theme--border-width) solid transparent;
        border-radius: var(--v-input-border-radius, var(--theme--border-radius));

        &:hover {
            border-color: var(--theme--border-color-subdued);
        }

        &:focus {
            border-color: var(--theme--primary);
        }
    }
</style>