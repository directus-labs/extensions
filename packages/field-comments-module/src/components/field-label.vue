<script setup lang="ts">
import { useEventListener } from '@vueuse/core';
import { ref } from 'vue';

const props = defineProps<{
	count: number;
	// eslint-disable-next-line vue/prop-name-casing
	field_id: number;
}>();

const comments_count = ref<number>(props.count ?? 0);
const event_key = ref<string>(`field_badge_${props.field_id}`);

// @ts-ignore
useEventListener(event_key.value, (e: Record<string, any>) => {
	comments_count.value = e.detail.count;
});
</script>

<template>
	<div class="v-badge">
		<span v-if="props.count > 0" class="badge">
			<span>{{ props.count }}</span>
		</span>
		<span class="v-icon"><i class="" data-icon="chat_bubble_outline" /></span>
	</div>
</template>

<style scoped>
  .v-badge {
	position: relative;
	display: inline-block;
	margin: 0 0.5em;
}

.v-badge .badge {
	position: absolute;
	top: calc(var(--v-badge-size, 16px) / -2 + var(--v-badge-offset-y, 0px));
	right: calc(var(--v-badge-size, 16px) / -2 + var(--v-badge-offset-x, 0px));
	z-index: 1;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: max-content;
	min-width: var(--v-badge-size, 16px);
	height: var(--v-badge-size, 16px);
	padding: 0 5px;
	color: var(--v-badge-color, var(--white));
	font-weight: 800;
	font-size: 9px;
	background-color: var(--theme--primary);
	border-radius: calc(var(--v-badge-size, 16px) / 2);
}

.v-badge .badge.left {
	right: unset;
	left: calc(var(--v-badge-size, 16px) / -2 + var(--v-badge-offset-x, 0px));
}

.v-badge .badge.bottom {
	top: unset;
	bottom: calc(var(--v-badge-size, 16px) / -2 + var(--v-badge-offset-y, 0px));
}

.v-icon {
	position: relative;
	display: inline-block;
	width: var(--v-icon-size, 24px);
	min-width: var(--v-icon-size, 24px);
	height: var(--v-icon-size, 24px);
	color: var(--theme--foreground-subdued, currentColor);
	font-size: 0;
	vertical-align: middle;
}

.v-icon i {
	display: block;
	font-family: 'Material Symbols';
	font-weight: normal;
	font-size: var(--v-icon-size, 24px);
	font-style: normal;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	white-space: nowrap;
	word-wrap: normal;
	direction: ltr;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-rendering: optimizeLegibility;
	font-feature-settings: 'liga';
	font-variation-settings:
		'FILL' 0,
		'wght' 400,
		'GRAD' 0,
		'opsz' 24;
}

.v-icon i::after {
	content: attr(data-icon);
}

.v-icon i.filled {
	font-variation-settings:
		'FILL' 1,
		'wght' 400,
		'GRAD' 0,
		'opsz' 24;
}

.v-icon svg {
	display: inline-block;
	color: inherit;
	fill: currentColor;
}
.v-icon svg.svg-inline--fa {
	width: auto;
	height: auto;
}
</style>
