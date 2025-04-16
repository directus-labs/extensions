<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
	modelValue: string;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: string];
}>();

const value = computed({
	get: () => props.modelValue || '',
	set: (val: string) => emit('update:modelValue', val),
});
</script>

<template>
	<div class="focus-keyphrase">
		<div class="field">
			<div class="type-label">
				Focus Keyphrase
			</div>
			<v-input
				v-model="value"
				placeholder="Enter the main keyword or phrase for this content"
				:disabled="false"
			/>
			<div class="hint">
				The main phrase you want this content to rank for in search engines
			</div>
		</div>
	</div>
</template>

<style scoped>
.focus-keyphrase {
	margin-bottom: 24px;
}

.field {
	margin-bottom: 12px;
}

.type-label {
	font-size: 14px;
	margin-bottom: 4px;
	color: var(--theme--foreground);
}

.hint {
	margin-top: 4px;
	font-size: 12px;
	color: var(--theme--foreground-subdued);
}
</style>
