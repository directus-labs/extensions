<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue';
import { onErrorCaptured, reactive, watch } from 'vue';

// New results get a fresh chance to render their display.
const props = defineProps<{ results: unknown }>();

// One boundary per result list instead of core's per-row error boundary, which costs a component per row. A
// description display carries its row key in this attribute, so a throwing display only drops its own row back to
// plain text.
const KEY_ATTR = 'data-description-key';

const failed = reactive(new Set<string>());
let logged = false;

watch(
	() => props.results,
	() => failed.clear(),
);

onErrorCaptured((error, instance) => {
	const key = getDescriptionKey(instance);
	if (key === null) return;

	failed.add(key);

	if (!logged) {
		logged = true;
		console.warn('A command palette description display failed, showing plain text instead', error);
	}

	return false;
});

function getDescriptionKey(instance: ComponentPublicInstance | null) {
	for (let current = instance; current; current = current.$parent) {
		const key = current.$attrs[KEY_ATTR];
		if (typeof key === 'string') return key;
	}

	return null;
}
</script>

<template>
	<slot :failed="failed" />
</template>
