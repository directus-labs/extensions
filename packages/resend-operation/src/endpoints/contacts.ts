export const contacts = {
	label: 'Contacts',
	icon: 'person',
	actions: {
		create: {
			label: 'Create Contact',
			description: 'Create a contact inside an audience.',
			icon: 'add',
			method: 'POST',
			path: '/audiences/:audienceId/contacts',
			options: [
				{
					field: 'email',
					name: 'Email',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The email address of the contact.',
						required: true,
					},
				},
				{
					field: 'audienceId',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience to add the contact to.',
						required: true,
					},
				},
				{
					field: 'firstName',
					name: 'First Name',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The first name of the contact.',
					},
				},
				{
					field: 'lastName',
					name: 'Last Name',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The last name of the contact.',
					},
				},
				{
					field: 'unsubscribed',
					name: 'Unsubscribed',
					type: 'boolean',
					meta: {
						width: 'full',
						interface: 'boolean',
						note: 'The subscription status of the contact.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { audienceId, email, firstName, lastName, unsubscribed } = params;
				return client.fetchRequest(`/audiences/${audienceId}/contacts`, 'POST', {
					email,
					first_name: firstName,
					last_name: lastName,
					unsubscribed,
				});
			},
		},
		retrieve: {
			label: 'Retrieve Contact',
			description: 'Retrieve a single contact from an audience.',
			icon: 'search',
			method: 'GET',
			path: '/audiences/:audienceId/contacts/:id',
			options: [
				{
					field: 'audienceId',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience the contact belongs to.',
						required: true,
					},
				},
				{
					field: 'id',
					name: 'Contact ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the contact you want to retrieve.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { audienceId, id } = params;
				return client.fetchRequest(`/audiences/${audienceId}/contacts/${id}`, 'GET');
			},
		},
		update: {
			label: 'Update Contact',
			description: 'Update an existing contact.',
			icon: 'edit',
			method: 'PATCH',
			path: '/audiences/:audienceId/contacts/:id',
			options: [
				{
					field: 'audienceId',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience the contact belongs to.',
						required: true,
					},
				},
				{
					field: 'id',
					name: 'Contact ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the contact you want to update.',
						required: true,
					},
				},
				{
					field: 'firstName',
					name: 'First Name',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The updated first name of the contact.',
					},
				},
				{
					field: 'lastName',
					name: 'Last Name',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						note: 'The updated last name of the contact.',
					},
				},
				{
					field: 'unsubscribed',
					name: 'Unsubscribed',
					type: 'boolean',
					meta: {
						width: 'full',
						interface: 'boolean',
						note: 'The updated subscription status of the contact.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { audienceId, id, firstName, lastName, unsubscribed } = params;
				return client.fetchRequest(`/audiences/${audienceId}/contacts/${id}`, 'PATCH', {
					first_name: firstName,
					last_name: lastName,
					unsubscribed,
				});
			},
		},
		delete: {
			label: 'Delete Contact',
			description: 'Remove an existing contact from an audience.',
			icon: 'delete',
			method: 'DELETE',
			path: '/audiences/:audienceId/contacts/:id',
			options: [
				{
					field: 'audienceId',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience the contact belongs to.',
						required: true,
					},
				},
				{
					field: 'id',
					name: 'Contact ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the contact you want to delete.',
					},
				},
				{
					field: 'email',
					name: 'Contact Email',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The email of the contact you want to delete.',
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { audienceId, id, email } = params;
				const path = id
					? `/audiences/${audienceId}/contacts/${id}`
					: `/audiences/${audienceId}/contacts?email=${encodeURIComponent(email)}`;
				return client.fetchRequest(path, 'DELETE');
			},
		},
		list: {
			label: 'List Contacts',
			description: 'Show all contacts from an audience.',
			icon: 'list',
			method: 'GET',
			path: '/audiences/:audienceId/contacts',
			options: [
				{
					field: 'audienceId',
					name: 'Audience ID',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						note: 'The ID of the audience to list contacts from.',
						required: true,
					},
				},
			],
			handler: async (client: any, params: any) => {
				const { audienceId } = params;
				return client.fetchRequest(`/audiences/${audienceId}/contacts`, 'GET');
			},
		},
	},
};
