<script setup lang="ts">
import { toRefs } from 'vue';
import RelatedItemsList from './related-items-list.vue';

const props = withDefaults(
	defineProps<{
		disabled?: boolean;
		collection: string;
		primaryKey: number | string;
		loading: boolean;
	}>(),
	{
		disabled: false,
	},
);

const { collection, primaryKey, loading } = toRefs(props);
</script>

<template>
	<div v-if="!loading" class="related-items-list">
		<RelatedItemsList
			:primary-key="primaryKey"
			:collection="collection"
			:disabled
		/>
	</div>
</template>
