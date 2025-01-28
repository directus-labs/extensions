<script setup lang="ts">
interface BaseActionProps {
	label: string;
	icon?: string;
	/** Styling of the button */
	kind?: 'normal' | 'secondary' | 'info' | 'success' | 'warning' | 'danger';
}

defineProps<BaseActionProps>();
</script>

<template>
	<v-button :kind="kind" small>
		{{ label }}
		<v-icon v-if="icon" :name="icon" right />
	</v-button>
</template>
