import { defineOperationApp } from '@directus/extensions-sdk';
import ResendOptions from './options.vue';

export default defineOperationApp({
	id: 'resend-operation',
	name: 'Resend',
	icon: 'mail',
	description: 'Use the Resend API to send an email',
	overview: ({ endpoint, action }) => [
		{ label: 'Endpoint', text: endpoint },
		{ label: 'Action', text: action },
	],
	options: ResendOptions as any,
});
