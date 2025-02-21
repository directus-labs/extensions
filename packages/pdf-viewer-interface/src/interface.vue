<!-- eslint-disable vue/prop-name-casing -->
<script setup lang="ts">
import { getAssetUrl } from '@directus-labs/utils';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { defaultButtonLabel } from './default-button-label';
import PdfViewer from './pdf-viewer.vue';

const props = withDefaults(defineProps<{
	file_field?: string;
	button_label?: string;
}>(), {
	button_label: defaultButtonLabel,
});

const { t } = useI18n();

const activeDialog = ref(false);

const { fileURL, fileIsValid } = useSelectedFile();

function useSelectedFile() {
	const fieldValues = inject('values', ref<Record<string, any>>({}));

		const fileID = computed(() => {
		if (!props.file_field)
			return null;
		return fieldValues.value[props.file_field] ?? null;
	});

	const fileURL = computed(() => {
		if (!fileID.value)
			return null;

		return getAssetUrl(fileID.value.id ?? fileID.value);
	});

	const fileIsValid = computed(() => !!fileID.value);

	return { fileURL, fileIsValid };
}
</script>

<template>
	<v-button :disabled="!fileIsValid" @click="activeDialog = true">
		{{ t(button_label) }}
	</v-button>

	<v-dialog v-model="activeDialog" @esc="activeDialog = false">
		<PdfViewer :url="fileURL">
			<template #nav>
				<v-button v-tooltip.left="t('cancel')" icon rounded secondary @click="activeDialog = false">
					<v-icon name="close" />
				</v-button>
			</template>
		</PdfViewer>
	</v-dialog>
</template>
