export const activities = {
	label: 'Activities',
	icon: 'sync_alt',
	actions: {
		audit: {
			label: ' Audit Logs',
			description: 'Retrieve the logs from HubSpot.',
			icon: 'search',
			method: 'GET',
			path: '/account-info/v3/activity/audit-logs',
			options: [
				{
					field: 'limit',
					name: 'Limit',
					type: 'integer',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The maximum number of results to display per page.',
						required: true,
					},
					schema: {
						default_value: 10,
					},
				},
				{
					field: 'id',
					name: 'Acting User ID',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						placeholder: '123456789',
						note: 'The User ID from Hubspot for the logs you want to retrieve.',
					},
				},
				{
					field: 'after',
					name: 'Pagenation token',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The paging cursor token of the last successfully read resource will be returned as the paging.next.after JSON property of a paged response containing more results.',
					},
				},
				{
					field: 'occurred_after',
					name: 'Occurred After',
					type: 'dateTime',
					meta: {
						width: 'half',
						interface: 'datetime',
					},
				},
				{
					field: 'occurred_before',
					name: 'Occurred Before',
					type: 'dateTime',
					meta: {
						width: 'half',
						interface: 'datetime',
					},
				},
				{
					field: 'sort',
					name: 'Sort',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'A HubSpot field to sort by such as userEmail, userId, category, subCategory or occurredAt',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { limit, id, after, occurred_after, occurred_before, sort } = params;
				return client.fetchRequest(`/account-info/v3/activity/audit-logs?limit=${limit ?? '10'}${after ? `&after=${after}` : ''}${id ? `&actingUserId=${id}` : ''}${occurred_after ? `&occurredAfter=${occurred_after}` : ''}${occurred_before ? `&occurredBefore=${occurred_before}` : ''}${sort ? `&sort=${sort}` : ''}`, 'GET');
			},
		},
		login: {
			label: 'Login Activity',
			description: 'Retrieve the login activity from HubSpot.',
			icon: 'person',
			method: 'GET',
			path: '/account-info/v3/activity/login',
			options: [
				{
					field: 'limit',
					name: 'Limit',
					type: 'integer',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The maximum number of results to display per page.',
						required: true,
					},
					schema: {
						default_value: 10,
					},
				},
				{
					field: 'id',
					name: 'User ID',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						placeholder: '123456789',
						note: 'Fetch login activity for a specific user.',
					},
				},
				{
					field: 'after',
					name: 'Pagenation token',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The paging cursor token of the last successfully read resource will be returned as the paging.next.after JSON property of a paged response containing more results.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { limit, id, after } = params;
				return client.fetchRequest(`/account-info/v3/activity/login?limit=${limit ?? '10'}${after ? `&after=${after}` : ''}${id ? `&userId=${id}` : ''}`, 'GET');
			},
		},
		security: {
			label: 'Security Activity',
			description: 'Retrieve the security activity from HubSpot.',
			icon: 'security',
			method: 'GET',
			path: '/account-info/v3/activity/security',
			options: [
				{
					field: 'limit',
					name: 'Limit',
					type: 'integer',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The maximum number of results to display per page.',
						required: true,
					},
					schema: {
						default_value: 10,
					},
				},
				{
					field: 'id',
					name: 'User ID',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						placeholder: '123456789',
						note: 'Fetch login activity for a specific user.',
					},
				},
				{
					field: 'after',
					name: 'Pagenation token',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The paging cursor token of the last successfully read resource will be returned as the paging.next.after JSON property of a paged response containing more results.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { limit, id, after } = params;
				return client.fetchRequest(`/account-info/v3/activity/security?limit=${limit ?? '10'}${after ? `&after=${after}` : ''}${id ? `&userId=${id}` : ''}`, 'GET');
			},
		},
	},
};
