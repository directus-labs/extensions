export const apiKeys = {
	label: 'API Keys',
	icon: 'key',
	actions: {
		create: {
			label: 'Create API Key',
			description: 'Add a new API key to authenticate communications with Resend.',
			icon: 'add',
			method: 'POST',
			path: '/api-keys',
			options: [
				{
					field: 'name',
					name: 'API Key Name',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The name for the new API key.',
						required: true,
					},
				},
				{
					field: 'permission',
					name: 'Permission',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: 'Full Access', value: 'full_access' },
								{ text: 'Sending Access', value: 'sending_access' },
							],
						},
						note: 'The level of access for the API key.',
					},
				},
				{
					field: 'domainId',
					name: 'Domain ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'Restrict the API key to send emails only from a specific domain. Only used when permission is set to sending_access.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { name, permission, domainId } = params;
				const createData = {
					name,
					permission,
					domain_id: domainId,
				};
				return client.fetchRequest('/api-keys', 'POST', createData);
			},
		},
		list: {
			label: 'List API Keys',
			description: 'Retrieve a list of API keys for the authenticated user.',
			icon: 'list',
			method: 'GET',
			path: '/api-keys',
			options: [],
			handler: async (client: any) => {
				return client.fetchRequest('/api-keys', 'GET');
			},
		},
		delete: {
			label: 'Delete API Key',
			description: 'Remove an existing API key.',
			icon: 'delete',
			method: 'DELETE',
			path: '/api-keys/:id',
			options: [
				{
					field: 'id',
					name: 'API Key ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the API key you want to delete.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/api-keys/${id}`, 'DELETE');
			},
		},
	},
};
