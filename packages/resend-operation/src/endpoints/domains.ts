export const domains = {
	label: 'Domains',
	icon: 'domain',
	actions: {
		retrieve: {
			label: 'Retrieve Domain',
			description: 'Retrieve a single domain for the authenticated user.',
			icon: 'search',
			method: 'GET',
			path: '/domains/:id',
			options: [
				{
					field: 'id',
					name: 'Domain ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the domain you want to retrieve.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/domains/${id}`, 'GET');
			},
		},
		verify: {
			label: 'Verify Domain',
			description: 'Verify an existing domain.',
			icon: 'check_circle',
			method: 'POST',
			path: '/domains/:id/verify',
			options: [
				{
					field: 'id',
					name: 'Domain ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the domain you want to verify.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/domains/${id}/verify`, 'POST');
			},
		},
		update: {
			label: 'Update Domain',
			description: 'Update an existing domain.',
			icon: 'edit',
			method: 'PATCH',
			path: '/domains/:id',
			options: [
				{
					field: 'id',
					name: 'Domain ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the domain you want to update.',
						required: true,
					},
				},
				{
					field: 'clickTracking',
					name: 'Click Tracking',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						note: 'Track clicks within the body of each HTML email.',
					},
				},
				{
					field: 'openTracking',
					name: 'Open Tracking',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						note: 'Track the open rate of each email.',
					},
				},
				{
					field: 'tls',
					name: 'TLS',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: 'Opportunistic', value: 'opportunistic' },
								{ text: 'Enforced', value: 'enforced' },
							],
						},
						note: 'Choose TLS setting. Default is "opportunistic".',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id, clickTracking, openTracking, tls } = params;
				return client.fetchRequest(`/domains/${id}`, 'PATCH', {
					click_tracking: clickTracking,
					open_tracking: openTracking,
					tls,
				});
			},
		},
		list: {
			label: 'List Domains',
			description: 'Retrieve a list of domains for the authenticated user.',
			icon: 'list',
			method: 'GET',
			path: '/domains',
			options: [],
			handler: async (client: any) => {
				return client.fetchRequest('/domains', 'GET');
			},
		},
		delete: {
			label: 'Delete Domain',
			description: 'Remove an existing domain.',
			icon: 'delete',
			method: 'DELETE',
			path: '/domains/:id',
			options: [
				{
					field: 'id',
					name: 'Domain ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the domain you want to delete.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { id } = params;
				return client.fetchRequest(`/domains/${id}`, 'DELETE');
			},
		},
	},
};
