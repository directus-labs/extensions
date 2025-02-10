<script setup lang="ts">
import { ref, type Ref } from 'vue';
import VuePdfEmbed from 'vue-pdf-embed';
// essential styles
import 'vue-pdf-embed/dist/style/index.css';

defineProps<{ url: string }>();

const view = ref<HTMLElement>();

const { rendered, invalidPDF, onRendered, reset, errorMessage } = usePdfViewer();
const { width, height, isFullHeight, fullHeight, fullWidth } = useSize(view, reset);

function usePdfViewer() {
	const rendered = ref(false);
	const invalidPDF = ref(false);
	const errorMessage = 'Failed to load PDF';

	return { rendered, invalidPDF, onRendered, reset, errorMessage };

	function onRendered() {
		invalidPDF.value = false;
		rendered.value = true;
	}

	function reset() {
		invalidPDF.value = false;
		rendered.value = false;
	}
}

function useSize(view: Ref<HTMLElement | undefined>, onChangeSize: () => void) {
	const width = ref<number | null>(null);
	const height = ref<number | null>(null);
	const isFullHeight = ref(false);

	return { width, height, isFullHeight, fullHeight, fullWidth };

	async function fullHeight() {
		isFullHeight.value = true;
		onChangeSize();
		await delay(100);

		const { height: viewHeight } = view.value!.getBoundingClientRect();

		width.value = null;
		height.value = viewHeight;
	}

	async function fullWidth() {
		isFullHeight.value = false;
		onChangeSize();
		await delay(100);

		const { width: viewWidth } = view.value!.getBoundingClientRect();

		width.value = viewWidth;
		height.value = null;
	}

	function delay(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
</script>

<template>
	<div class="wrapper">
		<div class="nav">
			<slot name="nav" />

			<v-button
				v-tooltip.left="$t('fit_to_screen')" class="full-height-btn" icon rounded secondary
				@click="fullHeight"
			>
				<v-icon name="height" small />
			</v-button>

			<v-button
				v-tooltip.left="$t('full_width')" class="full-width-btn" icon rounded secondary
				@click="fullWidth"
			>
				<v-icon name="width" small />
			</v-button>
		</div>

		<div ref="view" class="view" :class="{ 'full-height': isFullHeight }">
			<v-notice v-if="invalidPDF" type="danger">
				{{ errorMessage }}
			</v-notice>

			<VuePdfEmbed
				:source="url" :height="height" :width="width"
				@loading-failed="invalidPDF = true" @rendering-failed="invalidPDF = true" @rendered="onRendered"
			/>
		</div>

		<div v-if="!rendered && !invalidPDF" class="spinner">
			<v-progress-circular indeterminate />
		</div>
	</div>
</template>

<style scoped>
    .wrapper {
	display: flex;
	justify-content: center;
	width: calc(100vw - 40px);
	height: calc(100vh - 40px);
	gap: 20px;
	box-shadow: none;
}

.nav {
	order: 1;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.view {
	position: relative;
	width: 100%;
	height: 100%;
	overflow: auto;
	border-radius: var(--theme--border-radius);
}

.view.full-height {
	width: auto;
}

.spinner {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	width: var(--theme--form--field--input--height);
	height: var(--theme--form--field--input--height);
	border-radius: var(--theme--border-radius);
	background: var(--theme--background);
	z-index: 1;
}

.v-notice,
.spinner .v-progress-circular {
	--v-progress-circular-color: var(--theme--primary);
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	z-index: 1;
}

.v-notice {
	width: calc(2 * var(--form-column-max-width));
}

.vue-pdf-embed :deep(> div + div) {
	margin-top: 10px;
}

.vue-pdf-embed :deep(.vue-pdf-embed__page) {
	display: flex;
	align-items: center;
	flex-direction: column;
}

.full-width-btn :deep(.content) {
	border-left: 2px solid;
	border-right: 2px solid;
}

.full-height-btn :deep(.content) {
	border-top: 2px solid;
	border-bottom: 2px solid;
}
</style>
