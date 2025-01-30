<script setup lang="ts">
	import { useApi, useStores } from "@directus/extensions-sdk";
	import type { Activity } from "../types";
	import { schema_collection_name } from "../schema";
	import { ref, watch } from "vue";
	import CommentInput from "./comment-input.vue";
	import CommentItemHeader from "./comment-item-header.vue";

	const props = withDefaults(
		defineProps<{
			comment: Activity;
			refresh: () => Promise<void>;
			collection: string;
			field: number;
			primaryKey: string | number;
			userPreviews: Record<string, any>;
		}>(),
		{
			userPreviews: () => ({}),
		},
	);

	const api = useApi();
	const { useNotificationsStore, useUserStore } = useStores();
	const notificationStore = useNotificationsStore();
	const userStore = useUserStore();
	const currentUser = userStore.currentUser;

	const { editing, cancelEditing } = useEdits();

	function useEdits() {
		const edits = ref(props.comment.comment);
		const editing = ref(false);
		const savingEdits = ref(false);

		watch(
			() => props.comment,
			() => (edits.value = props.comment.comment),
		);

		return { edits, editing, savingEdits, saveEdits, cancelEditing };

		async function saveEdits() {
			savingEdits.value = true;

			try {
				await api.patch(`/items/${schema_collection_name}/${props.comment.id}`, {
					comment: edits.value,
					user_updated: currentUser.id,
				});

				props.refresh();
			} catch (error: any) {
				const code =
					error?.response?.data?.errors?.[0]?.extensions?.code ||
					error?.extensions?.code ||
					'UNKNOWN';

				console.warn(error);
				
				notificationStore.add({
					title: code,
					type: 'error',
					code,
					dialog: true,
					error,
				});
			} finally {
				savingEdits.value = false;
				editing.value = false;
			}
		}

		function cancelEditing() {
			edits.value = props.comment.comment;
			editing.value = false;
		}
	}
</script>

<template>
	<div class="comment-item">
		<comment-item-header :refresh="refresh" :comment="comment" @edit="editing = true" />

		<comment-input
			v-if="editing"
			:existing-comment="comment"
			:primary-key="props.primaryKey"
			:collection="props.collection"
            :field="props.field"
			:refresh="refresh"
			:previews="userPreviews"
			@cancel="cancelEditing"
		/>

		<div v-else v-md="{ value: comment.display, target: '_blank' }" class="content selectable" />
	</div>
</template>

<style scoped>
	.comment-item {
		position: relative;
		margin-bottom: 8px;
		padding: 8px;
		background-color: var(--theme--background);
		border-radius: var(--theme--border-radius);
	}

	.comment-item:last-of-type {
		margin-bottom: 8px;
	}

	.comment-item .content {
		display: inline-block;
		max-height: 300px;
		overflow-y: auto;
		min-width: 100%;
		max-width: 100%;
		margin-bottom: -6px;
		line-height: 1.4;
	}

	.comment-item .content :deep(> *:first-child),
	.comment-item .content :deep(p > *:first-child) {
		margin-top: 0;
	}

	.comment-item .content :deep(> *:last-child),
	.comment-item .content :deep(p > *:last-child) {
		margin-bottom: 0;
	}

	.comment-item .content :deep(a) {
		color: var(--theme--primary);
	}

	.comment-item .content :deep(blockquote) {
		margin: 8px 0;
		padding-left: 6px;
		color: var(--theme--foreground-subdued);
		font-style: italic;
		border-left: 2px solid var(--theme--form--field--input--border-color);
	}

	.comment-item .content :deep(img) {
		max-width: 100%;
		margin: 8px 0;
		border-radius: var(--theme--border-radius);
		display: block;
	}

	.comment-item .content :deep(hr) {
		height: 2px;
		margin: 12px 0;
		border: 0;
		border-top: 2px solid var(--theme--form--field--input--border-color);
	}

	.comment-item .content :deep(mark) {
		display: inline-block;
		padding: 2px 4px;
		color: var(--theme--primary);
		line-height: 1;
		background: var(--theme--primary-background);
		border-radius: var(--theme--border-radius);
		user-select: text;
		pointer-events: none;
	}

	.comment-item .content :deep(pre) {
		padding: 2px 4px;
		color: var(--theme--foreground);
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
		margin: 2px 0;
		font-family: var(--theme--fonts--monospace--font-family);
		white-space: nowrap;
		max-width: 100%;
		overflow-x: auto;
	}

	.comment-item .content :deep(code) {
		padding: 2px 4px;
		color: var(--theme--foreground);
		background-color: var(--theme--background-normal);
		border-radius: var(--theme--border-radius);
		margin: 2px 0;
		font-family: var(--theme--fonts--monospace--font-family);
	}

	.comment-item .content :deep(pre > code) {
		padding: 0;
		margin: 0;
		white-space: pre;
	}

	.comment-item .content :deep(:is(h1, h2, h3, h4, h5, h6)) {
		margin-top: 12px;
		font-weight: 600;
		font-size: 16px;
		color: var(--theme--foreground-accent);
	}

	.comment-item.expand .content::after {
		position: absolute;
		right: 0;
		bottom: 4px;
		left: 0;
		z-index: 1;
		height: 40px;
		background: linear-gradient(
			180deg,
			rgb(var(--background-page-rgb), 0) 0%,
			rgb(var(--background-page-rgb), 0.8) 25%,
			rgb(var(--background-page-rgb), 1) 100%
		);
		content: '';
	}

	.comment-item.expand .content .expand-text {
		position: absolute;
		right: 0;
		bottom: 8px;
		left: 0;
		z-index: 2;
		height: 24px;
		text-align: center;
		cursor: pointer;
	}

	.comment-item.expand .content .expand-text span {
		padding: 4px 12px 5px;
		color: var(--theme--foreground-subdued);
		font-weight: 600;
		font-size: 12px;
		background-color: var(--theme--background-normal);
		border-radius: 12px;
		transition:
			color var(--fast) var(--transition),
			background-color var(--fast) var(--transition);
	}

	.comment-item.expand .content .expand-text:hover span {
		color: var(--foreground-inverted);
		background-color: var(--theme--primary);
	}

	.comment-item:hover :deep(.comment-header .header-right .more + .time) {
		opacity: 0;
	}

	.comment-item:hover :deep(.comment-header .header-right .more) {
		opacity: 1;
	}

	.user-name {
		color: var(--theme--primary);
	}

	.buttons {
		position: absolute;
		right: 8px;
		bottom: 8px;
	}

	.cancel {
		margin-right: 4px;
	}
</style>