<script setup lang="ts">
interface CustomField {
	field: string;
	name: string;
	type: string;
	meta: Record<string, any>;
}

defineProps<{
	modelValue: Record<string, any>[];
	fields: CustomField[] | null;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: Record<string, any>[]];
}>();
</script>

<template>
	<div v-if="fields?.length" class="custom-fields">
		<v-divider />
		<v-form
			:fields="fields"
			:model-value="modelValue"
			@update:model-value="emit('update:modelValue', $event)"
		/>
	</div>
</template>

<style scoped>
.custom-fields {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
</style>
