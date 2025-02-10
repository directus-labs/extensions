<script setup lang="ts">
import { useCommandMenu } from '../composables/use-command-menu';

defineProps<{
	alwaysRender?: boolean;
}>();

const render = useCommandMenu((state) => !state.search);
</script>

<template>
	<div v-if="alwaysRender || render" cmdk-separator role="separator">
		<slot />
	</div>
</template>
