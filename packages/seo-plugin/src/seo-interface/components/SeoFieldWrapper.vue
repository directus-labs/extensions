<script setup lang="ts">
import type { SeoFieldState } from '../../shared/types/seo';

import ProgressBar from '../../shared/components/ProgressBar.vue';

defineProps<{
	label: string;
	state: SeoFieldState;
	rule: { minLength: number; maxLength: number };
}>();
</script>

<template>
	<div class="field">
		<label class="label field-label type-label">{{ label }}</label>
		<slot />
		<ProgressBar
			:progress="state.progress"
			:status="state.status"
		/>
		<small class="hint">
			<span>{{ state.message }}</span>
			{{ rule.minLength }}-{{ rule.maxLength }} characters recommended. (Current: {{ state.length ?? '?' }})
		</small>
	</div>
</template>

<style scoped>
.field {
	display: flex;
	flex-direction: column;
}
.label {
	margin-bottom: 0.5rem;
}
.hint {
	font-size: 0.875rem;
	color: var(--theme--foreground-subdued);
}
</style>
