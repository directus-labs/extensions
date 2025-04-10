<script setup lang="ts">
// NOTE: This is not being used, but it's still here for reference at the moment. This is a simple TipTap collaborative editor.
import { HocuspocusProvider } from '@hocuspocus/provider';
import CollaborationExtension from '@tiptap/extension-collaboration';
import CollaborationCursorExtension from '@tiptap/extension-collaboration-cursor';
import { StarterKit } from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { defineProps, onMounted, onUnmounted } from 'vue';
import * as Y from 'yjs';
import { useCurrentUser } from '../composables/use-current-user';

const props = defineProps<{
	url?: string;
	fieldName?: string;
}>();

const currentUser = useCurrentUser();

// Use provided URL or default
const url = props.url || 'http://localhost:8055/collaboration/1';

const provider = new HocuspocusProvider({
	url,
	name: 'collaborative-editing',
	onConnect() {
		// Update awareness state with field information
		if (props.fieldName) {
			provider.setAwarenessField('activeField', {
				field: props.fieldName,
			});
		}
	},
	onStatus: ({ status }) => {
		console.warn('Collaboration status:', status);
	},
	onAwarenessUpdate: ({ states }) => {
		console.warn('Awareness updated:', states.length, 'users connected');
	},
});

const editor = useEditor({
	extensions: [
		StarterKit.configure({
			history: false,
		}),
		CollaborationExtension.configure({
			document: provider.document,
			field: props.fieldName || 'content',
		}),
		CollaborationCursorExtension.configure({
			provider,
			user: {
				name: currentUser.value.first_name,
				color: currentUser.value.color,
			},
		}),
	],
});

onMounted(() => {
	if (props.fieldName) {
		const updateAwareness = () => {
			provider.setAwarenessField('activeField', {
				field: props.fieldName,
			});
		};

		// Update on focus
		const editorElement = document.querySelector('.ProseMirror');

		if (editorElement) {
			editorElement.addEventListener('focus', updateAwareness);
		}
	}
});

onUnmounted(() => {
	provider.destroy();
});
</script>

<template>
	<div>
		<EditorContent :editor="editor" />
	</div>
</template>
