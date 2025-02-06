<script setup lang="ts">
import type { Audio, AudioService, AudioSource } from './types';
import { computed, ref, type Ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Plyr from './plyr.vue';

const props = defineProps<{ value?: Audio }>();
const emit = defineEmits(['input']);

const { t } = useI18n();

const { services, service } = useAudioServices();
const { fileDrawer, fileID, setFileSelection } = useFileSelect(service);

const { sourceInput, inputIsClickable, inputPlaceholder, onInputClick }
	= useInputField(service, fileDrawer);

const { source, clearSource } = useAudioSource(service, sourceInput, fileID);

watch(() => props.value, setServiceAndSource, { immediate: true });
watch([service, source], emitInputValue);

function setServiceAndSource() {
	if (!props.value)
		return;

	service.value = props.value.service;

	if (service.value === 'directus') {
		fileID.value = props.value.source;
		return;
	}

	source.value = props.value.source;
}

function emitInputValue() {
	if (
		props.value?.service === service.value
		&& props.value?.source === source.value
	) {
		return;
	}

	const inputValue
		= service.value && source.value
			? { service: service.value, source: source.value }
			: null;

	emit('input', ref(inputValue));
}

function useAudioServices() {
	const services: { value: AudioService; text: string }[] = [
		{
			value: 'directus',
			text: 'Directus',
		},
		{
			value: 'external',
			text: 'External URL',
		},
	];

	const service = ref<AudioService | null>(null);

	return { service, services };
}

function useAudioSource(
	service: Ref<AudioService | null>,
	sourceInput: Ref<AudioSource | null | undefined>,
	fileID: Ref<AudioSource | null>,
) {
	const source = computed({
		get() {
			if (!service.value)
				return;

			if (service.value == 'directus')
				return fileID.value;

			return sourceInput.value;
		},
		set(newValue: AudioSource) {
			sourceInput.value = newValue;
		},
	});

	return { source, clearSource };

	function clearSource() {
		if (service.value == 'directus') {
			fileID.value = null;
			return;
		}

		source.value = null;
	}
}

function useFileSelect(service: Ref<AudioService | null>) {
	const fileDrawer = ref(false);
	const fileID = ref<AudioSource | null>(null);

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

function useInputField(
	service: Ref<AudioService | null>,
	fileDrawer: Ref<boolean>,
) {
	const sourceInput = ref<AudioSource | null>(null);

	const inputIsClickable = computed(
		() => !service.value || service.value == 'directus',
	);

	const inputPlaceholder = computed(() => {
		if (!service.value)
			return;

		if (service.value === 'directus')
			return t('choose_from_library');

		return `Audio Source …`;
	});

	return { sourceInput, inputIsClickable, inputPlaceholder, onInputClick };

	function onInputClick({ target }: { target: HTMLElement }) {
		if (!inputIsClickable.value)
			return;

		const clickOnMenu = !!target?.closest('.prepend .v-select');

		if (!clickOnMenu && service.value == 'directus') {
			fileDrawer.value = true;
			return;
		}

		const selectActivator: HTMLElement | null = target?.querySelector(
			'.prepend .v-menu-activator > *',
		);

		selectActivator?.click();
	}
}
</script>

<template>
	<v-input
		v-model="source"
		:clickable="inputIsClickable"
		:placeholder="inputPlaceholder"
		@click="onInputClick"
	>
		<template #prepend>
			<v-select
				v-model="service"
				:items="services"
				inline
				:placeholder="t('source')"
				placement="bottom-start"
			/>
		</template>
		<template #append>
			<v-icon v-if="service == 'directus' && !source" name="attach_file" />
			<v-icon
				v-if="service && source"
				v-tooltip="t('deselect')"
				class="deselect"
				name="close"
				clickable
				@click.stop="clearSource"
			/>
		</template>
	</v-input>

	<drawer-files
		:active="fileDrawer"
		@update:active="fileDrawer = false"
		@input="setFileSelection"
	/>

	<Plyr v-if="service && source" :service="service" :source="source" />
</template>

<style scoped>
.v-input :deep(.input .prepend) {
	margin-right: 16px;
}

.deselect:hover {
	--v-icon-color-hover: var(--theme--danger);
}
</style>
