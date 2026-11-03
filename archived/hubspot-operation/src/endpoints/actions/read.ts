// import schema from '../schema';
export function read(endpoint: string) {
	return {
		label: 'Fetch Record',
		description: 'Retrieve a single record from Hubspot using the ID.',
		icon: 'search',
		method: 'GET',
		path: `/crm/v3/objects/${endpoint}/:id`,
		options: [
			{
				field: 'id',
				name: 'HubSpot Record ID',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'input',
					note: 'The ID from Hubspot for the record you want to retrieve.',
					required: true,
				},
			},
			{
				field: 'r_fields',
				name: 'Properties',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					note: 'A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignored.',
				},
			},
			{
				field: 'revision_fields',
				name: 'Properties with Revisions',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					note: 'A comma separated list of the properties to be returned along with their history of previous values. If any of the specified properties are not present on the requested object(s), they will be ignored.',
				},
			},
			{
				field: 'r_associations',
				name: 'Associations',
				type: 'csv',
				meta: {
					width: 'full',
					interface: 'tags',
					note: 'A comma separated list of object types to retrieve associated IDs for. If any of the specified associations do not exist, they will be ignored.',
				},
			},
			{
				field: 'archived',
				name: 'Archived Records',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: 'Include',
					},
				},
			},
		],
		handler: async (client: any, params: any) => {
			const { id, r_fields, revision_fields, r_associations, archived, id_property } = params;
			return client.fetchRequest(`/crm/v3/objects/${endpoint}/${id}?archived=${archived}${r_fields ? `&properties=${r_fields.join(',')}` : ''}${revision_fields ? `&propertiesWithHistory=${revision_fields.join(',')}` : ''}${r_associations ? `&associations=${r_associations.join(',')}` : ''}${id_property ? `&idProperty=${id_property}` : ''}`, 'GET');
		},
	};
}
