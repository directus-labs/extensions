import type { DirectusContext } from './types';
import { Server } from '@hocuspocus/server';

export const createHocuspocusServer = (context: DirectusContext) => {
	const { logger, env, getSchema, services } = context;

	const hocuspocus = Server.configure({

		beforeHandleMessage: async (data) => {},

		onAuthenticate: async (data) => {},

		onAwarenessUpdate: async (data) => {},

	});

	return hocuspocus;
};
