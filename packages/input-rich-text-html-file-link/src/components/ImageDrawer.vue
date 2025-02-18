<script setup lang="ts">
import type { File, SettingsStorageAssetPreset } from '@directus/types';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	imageDrawerOpen: boolean;
	imageSelection: any;
	storageAssetTransform: string;
	storageAssetPresets: SettingsStorageAssetPreset[];
	folder: string | undefined;
}>();

const emit = defineEmits<{
	(e: 'closeImageDrawer'): void;
	(e: 'onImageSelect', image: File): void;
	(e: 'saveImage'): void;
}>();

defineSlots<{
	additionalFields: (props: { imageSelection: ImageSelection }) => void;
}>();

type ImageSelection = typeof props.imageSelection;

const { t } = useI18n();

const imageDrawerOpen = computed({
	get: () => props.imageDrawerOpen,
	set: (_value: boolean) => emit('closeImageDrawer'),
});

const imageSelection = computed({
	get: () => props.imageSelection,
	set: (file: File) => emit('onImageSelect', file),
});
</script>

<template>
	<v-drawer v-model="imageDrawerOpen" :title="t('wysiwyg_options.image')" icon="image" @cancel="emit('closeImageDrawer')">
		<div class="content">
			<template v-if="imageSelection">
				<img class="image-preview" :src="imageSelection.previewUrl">
				<div class="grid">
					<div class="field half">
						<div class="type-label">
							{{ t('image_url') }}
						</div>
						<v-input v-model="imageSelection.imageUrl" />
					</div>
					<div class="field half-right">
						<div class="type-label">
							{{ t('alt_text') }}
						</div>
						<v-input v-model="imageSelection.alt" :nullable="false" />
					</div>
					<template v-if="storageAssetTransform === 'all'">
						<div class="field half">
							<div class="type-label">
								{{ t('width') }}
							</div>
							<v-input
								v-model="imageSelection.width"
								:disabled="!!imageSelection.transformationKey"
							/>
						</div>
						<div class="field half-right">
							<div class="type-label">
								{{ t('height') }}
							</div>
							<v-input
								v-model="imageSelection.height"
								:disabled="!!imageSelection.transformationKey"
							/>
						</div>
					</template>
					<div class="field half">
						<div class="type-label">
							{{ t('wysiwyg_options.lazy_loading') }}
						</div>
						<v-checkbox
							v-model="imageSelection.lazy" block
							:label="t('wysiwyg_options.lazy_loading_label')"
						/>
					</div>
					<div
						v-if="storageAssetTransform !== 'none' && storageAssetPresets.length > 0"
						class="field half"
					>
						<div class="type-label">
							{{ t('transformation_preset_key') }}
						</div>
						<v-select
							v-model="imageSelection.transformationKey"
							:items="storageAssetPresets.map((preset: any) => ({ text: preset.key, value: preset.key }))"
							show-deselect
						/>
					</div>

					<slot name="additionalFields" :image-selection="imageSelection" />
				</div>
			</template>
			<v-upload v-else :multiple="false" from-library from-url :folder="folder" @input="(file: File) => emit('onImageSelect', file)" />
		</div>

		<template #actions>
			<v-button v-tooltip.bottom="t('save_image')" icon rounded @click="emit('saveImage')">
				<v-icon name="check" />
			</v-button>
		</template>
	</v-drawer>
</template>

<style scoped lang="scss">
@use '../core-clones/styles/mixins/form-grid' as form_grid_mixin;

.content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}

.image-preview {
	width: 100%;
	height: var(--input-height-tall);
	margin-bottom: 24px;
	object-fit: cover;
	border-radius: var(--theme--border-radius);
}

.grid {
	@include form_grid_mixin.form-grid;
}

.body {
	padding: 20px;
}
</style>
