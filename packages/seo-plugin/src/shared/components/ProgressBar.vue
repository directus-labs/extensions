<script setup lang="ts">
import type { SeoFieldStatus } from '../types/seo';

interface Props {
	progress: number;
	status: SeoFieldStatus;
}

defineProps<Props>();
</script>

<template>
	<div class="progress-bar">
		<div
			class="progress"
			:class="status"
			:style="{ width: `${progress}%` }"
		/>
	</div>
</template>

<style scoped>
.progress-bar {
	height: 5px;
	background-color: var(--theme--background-subdued);
	border-radius: 2.5px;
	margin: 0.5rem 0;
}
.progress {
	height: 100%;
	border-radius: 2.5px;
	transition: width 0.3s;
}
.progress.too-short {
	background-color: var(--theme--warning);
}
.progress.ideal {
	background-color: var(--theme--success);
}
.progress.too-long,
.progress.empty {
	background-color: var(--theme--danger);
}
</style>
