<template>
    <div class="field">
        <div class="type-label">{{ t('save') }}</div>
        <v-checkbox v-model="autosaveWritable" :label="t('automatic')" :disabled="!autosaveWritable && hasEdits"
            block />
    </div>

    <div class="field">
        <div class="type-label">{{ t('layouts.tabular.spacing') }}</div>
        <v-select v-model="tableSpacingWritable" :items="[
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
        ]" />
    </div>
</template>



<script setup lang="ts">
    import { useI18n } from 'vue-i18n';
    import { useSync } from "@directus/extensions-sdk";

    interface Props {
        tableSpacing: 'compact' | 'cozy' | 'comfortable';
        autoSave: boolean;
        hasEdits?: boolean;
    }

    defineOptions({ inheritAttrs: false });

    const props = defineProps<Props>();

    const emit = defineEmits(['update:tableSpacing', 'update:autoSave']);

    const { t } = useI18n();

    const autosaveWritable = useSync(props, 'autoSave', emit);
    const tableSpacingWritable = useSync(props, 'tableSpacing', emit);
</script>



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
</style>
