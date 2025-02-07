<script setup lang="ts">
import { cssVar } from '@directus/utils/browser';
import { computed, inject, nextTick, onMounted, ref, unref, watch } from 'vue';

interface Props {
	shareUrl: string;
	pageFilter?: string;
}

const props = withDefaults(defineProps<Props>(), {});
const values = inject('values');
const valuesLoaded = ref(false);

const theme = computed(() => {
	return {
		background: cssVar('--theme--background'),
	};
});

const pageFilter = computed(() => {
	if (!props.pageFilter || !valuesLoaded.value || !values) {
		return '';
	}

	// Replace {{values}} with the actual values
	return props.pageFilter.replace(/\{\{(.*?)\}\}/g, (match, key) => {
		return unref(values)[key];
	});
});

function getColorScheme() {
	// Check the color-scheme property of the body element
	const colorScheme = window.getComputedStyle(document.body).getPropertyValue('color-scheme');
	return colorScheme;
}

const url = computed(() => {
	if (!valuesLoaded.value) {
		return '';
	}

	const url = new URL(props.shareUrl);
	url.searchParams.append('embed', 'true');
	url.searchParams.append('theme', getColorScheme());
	url.searchParams.append('background', theme.value.background);

	// Optional: Add a filter for a specific page
	if (props.pageFilter) {
		url.searchParams.append('filters', `((is,page,(${unref(pageFilter)})))`);
	}

	return url.toString();
});

onMounted(() => {
	nextTick(() => {
		// Create a script element
		const script = document.createElement('script');
		script.async = true;
		script.src = 'https://plausible.io/js/embed.host.js';

		// Append the script to the document head
		document.head.appendChild(script);
	});
});

watch(
	values as object,
	(val) => {
		if (val) {
			valuesLoaded.value = true;
		}
	},
	{ immediate: true, once: true },
);
</script>

<template>
	<div class="plausible-container interface bordered">
		<iframe
			v-if="valuesLoaded"
			class="plausible-embed"
			plausible-embed
			:src="url"
			scrolling="auto"
			frameborder="0"
			loading="lazy"
			style="width: 1px; min-width: 100%; height: 1600px"
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
