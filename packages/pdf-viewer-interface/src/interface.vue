<template>
    <v-button @click="activeDialog = true" :disabled="!fileIsValid">{{ t(button_label) }}</v-button>

    <v-dialog v-model="activeDialog" @esc="activeDialog = false">
        <v-card>
            <div>{{ file_field }}</div>
            <div>{{ fileID }}</div>
            <div>{{ fileURL }}</div>
        </v-card>
    </v-dialog>
</template>



<script setup lang="ts">
    import { inject, ref, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { defaultButtonLabel } from './default-button-label';

    const props = withDefaults(defineProps<{
        file_field?: string;
        button_label?: string;
    }>(), {
        button_label: defaultButtonLabel
    });

    const { t } = useI18n();

    const activeDialog = ref(false);

    const { fileID, fileURL, fileIsValid } = useSelectedFile();

    function useSelectedFile() {
        const fieldValues = inject('values', ref<Record<string, any>>({}));
        const fileID = computed(() => {
            if (!props.file_field) return null;
            return fieldValues.value[props.file_field] ?? null;
        });
        const fileURL = computed(() => {
            if (!fileID.value) return null;
            return `/assets/${fileID.value}`;
        });
        const fileIsValid = computed(() => !!fileID.value);

        return { fileID, fileURL, fileIsValid };
    }
</script>



<style scoped>
    .v-card::v-deep {
        --v-card-min-width: calc(100vw - 40px) !important;
        max-height: calc(100vh - 40px) !important;
        height: 100%;
    }
</style>