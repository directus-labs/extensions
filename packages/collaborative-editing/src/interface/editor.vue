<script setup lang="ts">
import { HocuspocusProvider } from '@hocuspocus/provider';
import Collaboration from '@tiptap/extension-collaboration';

import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { StarterKit } from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import * as Y from 'yjs';
import { useCurrentUser } from '../composables/use-current-user';

const currentUser = useCurrentUser();

const provider = new HocuspocusProvider({
	url: 'http://0.0.0.0:1234',
	name: 'collaborative-editing',
	onOpen() {
		console.log('onOpen');
	},
	onConnect() {
		console.log('onConnect');
	},
	// onAuthenticated() {
	// 	console.log('onAuthenticated');
	// },
	// onAuthenticationFailed: ({ reason }) => {
	// 	console.log('onAuthenticationFailed', reason);
	// },
	onStatus: ({ status }) => {
		console.log('onStatus', status);
	},
	// onMessage: ({ event, message }) => {
	// 	console.log('onMessage', event, message);
	// },
	// onOutgoingMessage: ({ message }) => {
	// 	console.log('onOutgoingMessage', message);
	// },
	// onSynced: ({ state }) => {
	// 	console.log('onSynced', state);
	// },
	// onClose: ({ event }) => {
	// 	console.log('onClose', event);
	// },
	// onDisconnect: ({ event }) => {
	// 	console.log('onDisconnect', event);
	// },
	// onDestroy() {
	// 	console.log('onDestroy');
	// },
	// onAwarenessUpdate: ({ added, updated, removed }) => {
	// 	console.log('onAwarenessUpdate', added, updated, removed);
	// },
	// onAwarenessChange: ({ states }) => {
	// 	console.log('onAwarenessChange', states);
	// },
	// onStateless: ({ payload }) => {
	// 	console.log('onStateless', payload);
	// },
});

const editor = useEditor({
	extensions: [
		StarterKit.configure({
			history: false,
		}),
		Collaboration.configure({
			document: provider.document,
			field: 'content',
		}),
		CollaborationCursor.configure({
			provider,
			user: {
				name: currentUser.value.first_name,
				color: currentUser.value.color,
			},
		}),
	],
});
</script>

<template>
	<div>
		<EditorContent :editor="editor" />
	</div>
</template>
