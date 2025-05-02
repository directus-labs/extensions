<script setup lang="ts">
import { computed } from 'vue';
import BaseAction from './BaseAction.vue';

interface LinkActionProps {
	label: string;
	icon?: string;
	type?: string;
	url: string;
}

const props = defineProps<LinkActionProps>();

const link = computed(() => {
	const isInternal = props.url.startsWith('/') || props.url.startsWith('admin');

	let processedUrl = props.url;

	if (isInternal) {
		// Remove any potential 'admin' prefixes to prevent duplication
		const adminPrefixes = ['/admin/', '/admin', 'admin/', 'admin'];

		for (const prefix of adminPrefixes) {
			if (processedUrl.startsWith(prefix)) {
				processedUrl = processedUrl.slice(prefix.length);
				break;
			}
		}

		// Ensure the processed URL has a leading slash
		processedUrl = processedUrl.startsWith('/') ? processedUrl : `/${processedUrl}`;
	}

	return {
		label: props.label,
		icon: props.icon,
		type: props.type,
		to: isInternal ? processedUrl : undefined,
		href: isInternal ? undefined : props.url,
	};
});
</script>

<template>
	<BaseAction :label="link.label" :icon="link.icon" :type="link.type" :to="link.to" :href="link.href" />
</template>
