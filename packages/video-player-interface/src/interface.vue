<script setup lang="ts">
import type { Ref } from 'vue';
import type { Video, VideoID, VideoService } from './types';
import getVideoId from 'get-video-id';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Plyr from './plyr.vue';

const props = defineProps<{ value?: Video }>();
const emit = defineEmits(['input']);

const { t } = useI18n();

const { services, service } = useVideoServices();
const { fileDrawer, fileID, setFileSelection } = useFileSelect(service);
const { idInput, inputIsClickable, inputPlaceholder, onInputClick } = useInputField(service, fileDrawer);
const { id, clearID } = useVideoID(service, idInput, fileID);

watch(() => props.value, setServiceAndID, { immediate: true });
watch([service, id], emitInputValue);

function setServiceAndID() {
	if (!props.value)
		return;

	service.value = props.value.service;

	if (service.value === 'directus') {
		fileID.value = props.value.id;
		return;
	}

	id.value = props.value.id;
}

function emitInputValue() {
	if (props.value?.service === service.value && props.value?.id === id.value)
		return;

	const inputValue = service.value && id.value
		? { service: service.value, id: id.value }
		: null;

	emit('input', ref(inputValue));
}

function useVideoServices() {
	const services: { value: VideoService; text: string }[] = [
		{
			value: 'directus',
			text: 'Directus',
		},
		{
			value: 'youtube',
			text: 'YouTube',
		},
		{
			value: 'vimeo',
			text: 'Vimeo',
		},
	];

	const service = ref<VideoService | null>(null);

	return { service, services };
}

function useVideoID(service: Ref<VideoService | null>, idInput: Ref<VideoID | null | undefined>, fileID: Ref<VideoID | null>) {
	const id = computed({
		get() {
			if (!service.value)
				return;

			if (service.value === 'directus')
				return fileID.value;

			return idInput.value;
		},
		set(newValue) {
			const { id } = getVideoId(newValue as string ?? '');
			idInput.value = id ?? newValue;
		},
	});

	return { id, clearID };

	function clearID() {
		if (service.value === 'directus') {
			fileID.value = null;
			return;
		}

		id.value = null;
	}
}

function useFileSelect(service: Ref<VideoService | null>) {
	const fileDrawer = ref(false);
	const fileID = ref<VideoID | null>(null);

	watch(service, openIfFileEmptyOnSelection);

	return { fileDrawer, fileID, setFileSelection };

	async function setFileSelection(selection: string[] | null) {
		if (!selection)
			return;
		fileID.value = selection[0] ?? null;
	}

	function openIfFileEmptyOnSelection(newValue: any, oldValue: any) {
		if (newValue !== oldValue && newValue === 'directus' && !fileID.value)
			fileDrawer.value = true;
	}
}

function useInputField(service: Ref<VideoService | null>, fileDrawer: Ref<boolean>) {
	const idInput = ref<VideoID | null>(null);
	const inputIsClickable = computed(() => !service.value || service.value === 'directus');

	const inputPlaceholder = computed(() => {
		if (!service.value)
			return;

		if (service.value === 'directus')
			return t('choose_from_library');

		return 'Video ID …';
	});

	return { idInput, inputIsClickable, inputPlaceholder, onInputClick };

	function onInputClick({ target }: { target: HTMLElement }) {
		if (!inputIsClickable.value)
			return;

		const clickOnMenu = !!target?.closest('.prepend .v-select');

		if (!clickOnMenu && service.value === 'directus') {
			fileDrawer.value = true;
			return;
		}

		const selectActivator: HTMLElement | null = target?.querySelector('.prepend .v-menu-activator > *');
		selectActivator?.click();
	}
}
</script>

<template>
	<v-input v-model="id" :clickable="inputIsClickable" :placeholder="inputPlaceholder" @click="onInputClick">
		<template #prepend>
			<v-select
				v-model="service" :items="services" inline :placeholder="t('source')"
				placement="bottom-start"
			/>
		</template>
		<template #append>
			<v-icon v-if="service === 'directus' && !id" name="attach_file" />
			<v-icon
				v-if="service && id" v-tooltip="t('deselect')" class="deselect" name="close" clickable
				@click.stop="clearID"
			/>
		</template>
	</v-input>

	<drawer-files :active="fileDrawer" @update:active="fileDrawer = false" @input="setFileSelection" />

	<Plyr v-if="service && id" :id="id" :service="service" />
</template>

<style scoped>
    .v-input :deep(.input .prepend) {
	margin-right: 16px;
}

.deselect:hover {
	--v-icon-color-hover: var(--theme--danger);
}
</style>
