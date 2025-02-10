<script lang="ts" setup>
import { useStores } from '@directus/extensions-sdk';
import { ref } from 'vue';

const props = withDefaults(defineProps<{
	show: boolean;
}>(), {
	show: false,
});

const emit = defineEmits(['update:modelValue', 'fileSelected']);
const { useCollectionsStore } = useStores();
const collectionStore = useCollectionsStore();
const uploaderComponentElement = ref<HTMLElement>();
const haveFilesAccess = Boolean(collectionStore.getCollection('directus_files'));

function setFile($value: any) {
	emit('fileSelected', $value);
	emit('update:modelValue', false);
}
</script>

<template>
	<v-drawer
		v-if="haveFilesAccess"
		:model-value="props.show"
		icon="image"
		title="Insert image"
		cancelable
		@update:model-value="emit('update:modelValue', false)"
		@cancel="emit('update:modelValue', false)"
	>
		<div class="uploader-drawer-content">
			<v-upload
				:ref="uploaderComponentElement"
				:multiple="false"
				from-library
				from-url
				@input="setFile"
			/>
		</div>
	</v-drawer>
</template>

<style lang="scss" scoped>
	.uploader-drawer-content {
	padding: var(--content-padding);
	padding-top: 0;
	padding-bottom: var(--content-padding);
}
</style>
