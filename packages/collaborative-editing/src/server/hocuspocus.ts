import { Server } from '@hocuspocus/server';

export const hocuspocus = Server.configure({
	onAwarenessUpdate(data) {
		console.log('onAwarenessUpdate', data);
	},
});
