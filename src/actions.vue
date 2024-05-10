<template>
    <transition name="fade">
        <span v-if="itemCount" class="item-count">
            {{ showingCount }}
        </span>
    </transition>

    <v-button
        v-tooltip.bottom="autoSave ? t('saves_automatically') : `${t('save')} (${translateShortcut(['meta', 's'])})`"
        rounded icon :disabled="autoSave || !hasEdits" @click="saveEdits" :loading="saving">
        <v-icon :name="autoSave ? 'published_with_changes' : 'check'" />
    </v-button>
</template>



<script setup lang="ts">
    import { useI18n } from 'vue-i18n';
    import { translateShortcut } from './core-clones/utils/translate-shortcut';

    defineOptions({ inheritAttrs: false });

    defineProps<{
        itemCount?: number;
        showingCount: string;
        autoSave?: boolean;
        hasEdits?: boolean;
        saving: boolean;
        saveEdits: () => void;
    }>();

    const { t } = useI18n();
</script>



<style lang="scss" scoped>
    .v-button {
        margin-right: 8px;
    }

    .item-count {
        position: relative;
        display: none;
        margin: 0 8px;
        color: var(--theme--foreground-subdued);
        white-space: nowrap;

        @media (min-width: 600px) {
            display: inline;
        }
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity var(--medium) var(--transition);
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
