<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import { computed } from 'vue';

interface Props {
	shareUrl: string;
}

const props = withDefaults(defineProps<Props>(), {});

const theme = computed(() => {
	return {
		background: cssVar('--theme--background'),
	};
});

function getColorScheme() {
	// Check the color-scheme property of the body element
	const colorScheme = window.getComputedStyle(document.body).getPropertyValue('color-scheme');
	return colorScheme;
}

const url = computed(() => {
	const url = new URL(props.shareUrl);
	url.searchParams.append('embed', 'true');
	url.searchParams.append('theme', getColorScheme());
	url.searchParams.append('background', theme.value.background);
	return url.toString();
});
</script>

<template>
	<div class="plausible-container interface bordered">
		<iframe
			class="plausible-embed"
			plausible-embed
			:src="url"
			scrolling="auto"
			frameborder="0"
			loading="lazy"
			style="width: 1px; min-width: 100%; height: 100%"
		/>
	</div>
</template>

<style scoped>
.plausible-container {
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--theme--background);
}

.bordered {
	display: flex;
	align-items: center;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}

.plausible-embed {
	border-radius: var(--theme--border-radius);
	background-color: var(--theme--background);
}
</style>
