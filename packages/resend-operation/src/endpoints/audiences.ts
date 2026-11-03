export const audiences = {
	label: 'Audiences',
	icon: 'group',
	actions: {
		create: {
			label: 'Create Audience',
			description: 'Create a new audience.',
			icon: 'add',
			method: 'POST',
			path: '/audiences',
			options: [
				{
					field: 'name',
					name: 'Audience Name',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The name for the new audience.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { name } = params;
				return client.fetchRequest('/audiences', 'POST', { name });
			},
		},
		retrieve: {
			label: 'Retrieve Audience',
			description: 'Retrieve a single audience.',
			icon: 'search',
			method: 'GET',
			path: '/audiences/:id',
			options: [
				{
					field: 'id',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience you want to retrieve.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/audiences/${id}`, 'GET');
			},
		},
		delete: {
			label: 'Delete Audience',
			description: 'Remove an existing audience.',
			icon: 'delete',
			method: 'DELETE',
			path: '/audiences/:id',
			options: [
				{
					field: 'id',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience you want to delete.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/audiences/${id}`, 'DELETE');
			},
		},
		list: {
			label: 'List Audiences',
			description: 'Retrieve a list of audiences.',
			icon: 'list',
			method: 'GET',
			path: '/audiences',
			options: [],
			handler: async (client: any) => {
				return client.fetchRequest('/audiences', 'GET');
			},
		},
	},
};
