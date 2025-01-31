<template>
    <div class="pdf-viewer-interface mb-4">
        <v-button class="full-width"  @click="activeDialog = true" :disabled="!fileIsValid">{{ t(button_label) }}</v-button>

        <v-dialog v-model="activeDialog" @esc="activeDialog = false">
            <pdf-viewer :url="fileURL">
                <template #nav>
                    <v-button v-tooltip.left="t('cancel')" icon rounded secondary @click="activeDialog = false">
                        <v-icon name="close" />
                    </v-button>
                </template>
            </pdf-viewer>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
    import { inject, ref, computed, onMounted } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { defaultButtonLabel } from './default-button-label';
    import PdfViewer from './pdf-viewer.vue'

    const props = withDefaults(defineProps<{
        file_field?: string;
        button_label?: string;
    }>(), {

        button_label: defaultButtonLabel
    });

    const { t } = useI18n();

    const activeDialog = ref(false);

    const { fileURL, fileIsValid } = useSelectedFile();

    function useSelectedFile() {
        const fieldValues = inject('values', ref<Record<string, any>>({}));
        const fileID = computed(() => {
            if (!props.file_field) return null;
            return fieldValues.value[props.file_field] ?? null;
        });
        const fileURL = computed(() => {
            if (!fileID.value || !fileID.value.id) return null;
            return `/assets/${fileID.value.id}`;
        });
        const fileIsValid = computed(() => !!fileID.value);

        return { fileURL, fileIsValid };
    }

    onMounted(() => {
        const pdfContent = document.querySelector('.pdf-viewer-interface');
        const parent = pdfContent?.closest('.drawer-item-order');
        const htmlContent = pdfContent?.closest('.interface')?.closest('.field');

        if (!parent || !htmlContent || !pdfContent) { return; }

        pdfContent.classList.add('pb-32');
        pdfContent.querySelector('button')?.classList.add('full-width');
        parent?.insertBefore(htmlContent, parent.firstChild);
    });
</script>

<style scoped>
.full-width {
    width: 100%;
}
.pb-32 {
    padding-bottom: 32px;
}
</style>