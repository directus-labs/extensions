<script setup lang="ts">
withDefaults(
	defineProps<{
		progress?: number;
		label?: string;
	}>(),
	{
		label: 'Loading...',
	},
);
</script>

<template>
	<div
		cmdk-loading
		role="progressbar"
		:aria-valuenow="progress"
		:aria-valuemin="0"
		:aria-valuemax="100"
		:aria-label="label"
	>
		<div aria-hidden>
			{child}
		</div>
	</div>
</template>
