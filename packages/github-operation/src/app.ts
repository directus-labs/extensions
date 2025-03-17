import { defineOperationApp } from '@directus/extensions-sdk';

export default defineOperationApp({
	id: 'directus-labs-github-operation',
	name: 'GitHub Operation',
	icon: 'github',
	description: 'An Operation to allow Flows to send a webhook request to start GitHub Action!',
	overview: (options) => [
		{
			label: 'Repository',
			text: `${options.owner}/${options.repo}`,
		},
		{
			label: 'Access Token',
			text: options.accessToken ? 'Secured' : 'Missing!',
		},
		{
			label: 'Event Type',
			text: options.eventType,
		},{
			label: 'Client Payload',
			text: options.clientPayload,
		},
	],
	options: [
		{
			field: 'owner',
			name: 'Owner',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				required: true,
				note: 'The account owner of the repository. The name is not case sensitive.',
			},
		},
		{
			field: 'repo',
			name: 'Repository',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				required: true,
				note: 'The name of the repository without the .git extension. The name is not case sensitive.',
			},
		},
		{
			field: 'accessToken',
			name: 'Access Token',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				required: true,
				note: 'OAuth app tokens or personal access tokens (classic). Requires the repo scope.',
				options: {
					masked: true,
				},
			},
		},
		{
			field: 'eventType',
			name: 'Event type',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'input',
				required: true,
				note: 'A custom webhook event name. Must be 100 characters or fewer.',
				options: {
					maxLength: 100,
				},
			},
		},
		{
			field: 'clientPayload',
			name: 'Client Payload',
			type: 'json',
			meta: {
				width: 'full',
				interface: 'input-code',
				note: 'JSON payload with extra information about the webhook event that your action or workflow may use. The maximum number of top-level properties is 10. The total size of the JSON payload must be less than 64KB.',
				options: {
					placeholder: '{ "unit": false, "integration": true }',
					template: '{ "unit": false, "integration": true }',
				},
			},
		},
	],
});
