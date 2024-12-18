<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useApi } from '@directus/extensions-sdk';
import { useI18n } from 'vue-i18n';

import { getRootPath } from '../utils/get-root-path';

interface Image {
	id: string;
	type: string;
	filesize: number;
	width: number;
	height: number;
	filename_download: string;
	title?: string;
	modified_on?: string;
}

interface ImageUuidInterfaceProps {
	value?: string | Record<string, any> | null;
	disabled?: boolean;
	folder?: string;
	file_key_to_get?: string;
	crop?: boolean;
	letterbox?: boolean;
	width?: string;
}

const props = withDefaults(defineProps<ImageUuidInterfaceProps>(), {
	value: null,
	disabled: false,
	folder: undefined,
	file_key_to_get: 'filename_disk',
	crop: false,
	letterbox: false,
	width: 'auto',
});

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const loading = ref(false);
const image = ref<Image | null>(null);
// const lightboxActive = ref(false);
const editDrawerActive = ref(false);
const imageError = ref<string | null>(null);
const isImage = ref(true);

const api = useApi();
const { t, te } = useI18n();

function addQueryToPath(path: string, query: Record<string, string>): string {
	const queryParams: string[] = [];
	for (const [key, value] of Object.entries(query)) {
		queryParams.push(`${key}=${value}`);
	}
	return path.includes('?') ? `${path}&${queryParams.join('&')}` : `${path}?${queryParams.join('&')}`;
}

function getToken(api: any): string | null {
	return api.defaults.headers.common['Authorization']?.split(' ')[1] || null;
}

function addTokenToURL(api: any, url: string, token?: string): string {
	const accessToken = token || getToken(api);
	if (!accessToken) return url;
	return addQueryToPath(url, { access_token: accessToken });
}

const src = computed(() => {
	if (!image.value?.type) return null;

	if (image.value.type.includes('svg')) {
		return addTokenToURL(api, getRootPath() + `assets/${image.value.id}`);
	}

	if (image.value.type.includes('image')) {
		const fit = props.crop ? 'cover' : 'contain';
		const url = getRootPath() + `assets/${image.value.id}?key=system-large-${fit}&cache-buster=${image.value.modified_on}`;
		return addTokenToURL(api, url);
	}

	return null;
});

const meta = computed(() => {
	if (!image.value) return null;
	const { filesize, width, height, type } = image.value;

	if (width && height) {
		return `${width}x${height} • ${filesize} • ${type}`;
	}

	return `${filesize} • ${type}`;
});

const edits = computed(() => {
	if (props.value && typeof props.value === 'object') {
		return props.value;
	}
	return {};
});

async function fetchImage() {
	loading.value = true;
	try {
		let id = typeof props.value === 'string' ? props.value : props.value?.id;
		id = id.split('.').slice(0, -1).join('.');

		const response = await api.get(`/files/${id}`, {
			params: {
				fields: ['id', 'title', 'width', 'height', 'filesize', 'type', 'filename_download'],
			},
		});

		if (props.value !== null && typeof props.value === 'object') {
			image.value = {
				...response.data.data,
				...props.value,
			};
		} else {
			image.value = response.data.data;
		}
	} catch (err: any) {
		console.log(err);
	} finally {
		loading.value = false;
	}
}

async function imageErrorHandler() {
	isImage.value = false;
	if (!src.value) return;
	try {
		await api.get(src.value);
	} catch (err: any) {
		imageError.value = err.response?.data?.errors[0]?.extensions?.code;
		if (!imageError.value || !te('errors.' + imageError.value)) {
			imageError.value = 'UNKNOWN';
		}
	}
}

function setImage(data: Image) {
	image.value = data;
	emit('input', data[props.file_key_to_get]);
}

function deselect() {
	emit('input', null);
	loading.value = false;
	image.value = null;
	// lightboxActive.value = false;
	editDrawerActive.value = false;
}

function stageEdits(newEdits: Record<string, any>) {
	if (!image.value) return;
	emit('input', image.value[props.file_key_to_get]);
}

watch(
	() => props.value,
	(newValue, oldValue) => {
		if (newValue === oldValue) return;
		if (newValue) {
			fetchImage();
		}
		if (oldValue && newValue === null) {
			deselect();
		}
	},
	{ immediate: true }
);
</script>
<template>
	<div class="image" :class="[width, { crop }]">
		<v-skeleton-loader v-if="loading" type="input-tall" />

		<v-notice v-else-if="disabled && !image" class="disabled-placeholder" center icon="hide_image">
			{{ t('no_image_selected') }}
		</v-notice>

		<div v-else-if="image" class="image-preview">
			<div v-if="imageError || !src" class="image-error">
				<v-icon large :name="imageError === 'UNKNOWN' ? 'error' : 'info'" />
				<span class="message">
					{{ src ? t(`errors.${imageError}`) : t('errors.UNSUPPORTED_MEDIA_TYPE') }}
				</span>
			</div>

			<img
				v-else-if="isImage"
				:src="src"
				:class="{ 'is-letterbox': letterbox }"
				:alt="image.title || ''"
				role="presentation"
				@error="imageErrorHandler"
			/>

			<div v-else class="fallback">
				<v-icon name="description" />
			</div>

			<div class="shadow" />

			<div v-if="!disabled" class="actions">
				<!-- <v-button v-tooltip="t('zoom')" icon rounded @click="lightboxActive = true">
					<v-icon name="zoom_in" />
				</v-button> -->
				<v-button v-tooltip="t('download')" icon rounded :href="src" :download="image.filename_download">
					<v-icon name="download" />
				</v-button>
				<v-button v-tooltip="t('edit_item')" icon rounded @click="editDrawerActive = true">
					<v-icon name="open_in_new" />
				</v-button>
				<v-button v-tooltip="t('deselect')" icon rounded @click="deselect">
					<v-icon name="close" />
				</v-button>
			</div>

			<div class="info">
				<div class="title">{{ image.title }}</div>
				<div class="meta">{{ meta }}</div>
			</div>

			<drawer-item
				v-if="!disabled && image"
				v-model:active="editDrawerActive"
				collection="directus_files"
				:primary-key="image.id"
				:edits="edits"
				@input="stageEdits"
			/>
			<!-- TODO: Add lightbox functionality -->
			<!-- <file-lightbox
				v-if="image"
				v-model="lightboxActive"
				:id="image.id"
				:title="image.title"
			/> -->
		</div>
		<v-upload v-else from-library from-url :folder="folder" @input="setImage" />
	</div>
</template>

<style lang="scss" scoped>
.image-preview {
	position: relative;
	width: 100%;
	height: var(--input-height-tall);
	overflow: hidden;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);

	img {
		z-index: 1;
		width: 100%;
		height: 100%;
		max-height: inherit;
		object-fit: contain;

		&.is-letterbox {
			padding: 32px;
		}
	}
}

.image {
	&.full,
	&.fill {
		.image-preview {
			height: auto;
			max-height: 400px;
		}
	}

	&.crop {
		.image-preview img {
			object-fit: cover;
		}
	}
}

.fallback {
	background-color: var(--theme--background-normal);
	display: flex;
	align-items: center;
	justify-content: center;
	height: var(--input-height-tall);
	border-radius: var(--theme--border-radius);
}

.image-error {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	color: var(--theme--foreground-subdued);
	background-color: var(--theme--background-normal);
	.v-icon {
		margin-bottom: 6px;
	}
	.message {
		max-width: 300px;
		padding: 0 16px;
		text-align: center;
	}
}
.shadow {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 2;
	width: 100%;
	height: 40px;
	overflow: hidden;
	line-height: 1;
	white-space: nowrap;
	text-overflow: ellipsis;
	background: linear-gradient(180deg, rgba(38, 50, 56, 0) 0%, rgba(38, 50, 56, 0.25) 100%);
	transition: height var(--fast) var(--transition);
}
.actions {
	--v-button-color: var(--theme--form--field--input--foreground-subdued);
	--v-button-background-color: var(--white);
	--v-button-color-hover: var(--theme--form--field--input--foreground);
	--v-button-background-color-hover: var(--white);

	position: absolute;
	top: 30%;
	left: 0;
	z-index: 3;
	display: flex;
	justify-content: center;
	width: 100%;
	.v-button {
		margin-right: 12px;
		transform: translateY(10px);
		opacity: 0;
		transition: var(--medium) var(--transition);
		transition-property: opacity transform;
		@for $i from 0 through 4 {
			&:nth-of-type(#{$i + 1}) {
				transition-delay: $i * 25ms;
			}
		}
	}
	.v-button:last-child {
		margin-right: 0px;
	}
}
.info {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 3;
	width: 100%;
	padding: 8px 12px;
	line-height: 1.2;
}
.title {
	color: var(--white);
}
.meta {
	height: 17px;
	max-height: 0;
	overflow: hidden;
	color: rgba(255, 255, 255, 0.75);
	transition: max-height var(--fast) var(--transition);
}
.image-preview:hover {
	.shadow {
		height: 100%;
		background: linear-gradient(180deg, rgba(38, 50, 56, 0) 0%, rgba(38, 50, 56, 0.5) 100%);
	}
	.actions .v-button {
		transform: translateY(0px);
		opacity: 1;
	}
	.meta {
		max-height: 17px;
	}
}
.disabled-placeholder {
	height: var(--theme--input-height-tall);
}
</style>
