<script setup lang="ts">
import { useCommandMenu } from '../composables/use-command-menu';

const render = useCommandMenu((state) => state.filtered.count === 0);
</script>

<template>
	<div v-if="render" cmdk-empty role="presentation">
		<slot />
	</div>
</template>
