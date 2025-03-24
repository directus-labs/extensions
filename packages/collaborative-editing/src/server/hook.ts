import { defineHook } from '@directus/extensions-sdk';
import { setupWSConnection } from './utils';

export default defineHook(({ action }) => {
	// console.log('Collaborative editing hook loaded');
	// action('websocket.error', ({ client, event }) => {
	// 	console.log('WebSocket error:', client, event);
	// })
	// action('websocket.auth.success', ({ client }) => {
	// 	console.log('WebSocket authentication success:', client);
	// })
	// action('websocket.auth.failure', ({ client }) => {
	// 	console.log('WebSocket authentication failure:', client);
	// })
	// action('websocket.connect', ({ client }) => {
	// 	// console.log('WebSocket client connected:', client);
	// })
	// action('websocket.message', ({ message, client }, _) => {
	// 	if (message.type === 'join-room') {
	// 		setupWSConnection(client, message.room);
	// 	}
	// });
});
