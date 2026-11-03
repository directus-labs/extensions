export function list(endpoint: string) {
	return {
		label: 'List Records',
		description: 'Show all records for this endpoint',
		icon: 'list',
		method: 'GET',
		path: `/crm/v3/objects/${endpoint}`,
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
				field: 'l_fields',
				name: 'Properties',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					note: 'A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignored.',
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
			const { limit, l_fields, after } = params;
			return client.fetchRequest(`/crm/v3/objects/${endpoint}?limit=${limit ?? '10'}${l_fields ? `&properties=${l_fields.join(',')}` : ''}${after ? `&after=${after}` : ''}`, 'GET');
		},
	};
}
