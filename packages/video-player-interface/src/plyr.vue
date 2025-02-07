<script setup lang="ts">
import type { VideoID, VideoService } from './types';
import Plyr from 'plyr';
import { onMounted, ref, watch } from 'vue';

const props = defineProps<{ service: VideoService; id: VideoID }>();

const el = ref();
let player: any;

onMounted(() => {
	player = new Plyr(el.value, { youtube: { noCookie: true } });
});

watch([() => props.service, () => props.id], updateSource);

function updateSource() {
	player.source = {
		type: 'video',
		sources: [props.service === 'directus'
			? {
					src: getAssetUrl(props.id),
					type: 'video/mp4',
				}
			: {
					src: props.id,
					provider: props.service,
				},
		],
	};
}

function getAssetUrl(id: VideoID) {
	return `/assets/${id}`;
}
</script>

<template>
	<div class="wrapper">
		<component
			:is="service === 'directus' ? 'video' : 'div'" ref="el"
			:src="service === 'directus' ? getAssetUrl(id) : null" :playsinline="service === 'directus'"
			:controls="service === 'directus'" :type="service === 'directus' ? 'video/mp4' : null"
			:data-plyr-provider="service !== 'directus' ? service : null"
			:data-plyr-embed-id="service !== 'directus' ? id : null"
		/>
	</div>
</template>

<style>
    @import 'plyr';

:root {
	--plyr-color-main: var(--theme--primary);
	--plyr-control-radius: var(--theme--border-radius);
	--plyr-font-family: var(--theme--fonts--sans--font-family);
	--plyr-font-weight-regular: var(--theme--fonts--sans--font-weight);
}
</style>

<style scoped>
    .wrapper {
	margin-top: 4px;
	border-radius: var(--theme--border-radius);
	border: var(--theme--border-width) solid var(--v-input-border-color, var(--theme--form--field--input--border-color));
	overflow: hidden;
}
</style>
