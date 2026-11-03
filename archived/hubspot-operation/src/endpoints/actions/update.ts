import schema from '../schema';

export function update(endpoint: string) {
	return {
		label: 'Update Record',
		description: 'Update an existing record in HubSpot.',
		icon: 'edit',
		method: 'PATCH',
		path: `/crm/v3/objects/${endpoint}/:id`,
		options: [
			{
				field: 'id',
				name: 'HubSpot Record ID',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'input',
					placeholder: '123456789',
					note: 'The ID from Hubspot for the record you want to change.',
					required: true,
				},
			},
			{
				field: 'u_properties',
				name: 'Properties',
				type: 'json',
				meta: {
					width: 'full',
					interface: 'input-code',
					note: 'Information to update in the new record.',
					options: {
						language: 'json',
						placeholder: JSON.stringify(schema.properties[endpoint]),
						template: JSON.stringify(schema.properties[endpoint]),
					},
				},
			},
		],
		handler: async (client: any, params: any) => {
			const { id, u_properties } = params;
			return client.fetchRequest(`/crm/v3/objects/${endpoint}/${id}`, 'PATCH', {
				properties: u_properties,
			});
		},
	};
}
