// import schema from '../schema';
export const read = (endpoint: string) => {
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
                field: 'fields',
                name: 'Fields',
                type: 'csv',
                meta: {
                    width: 'full',
                    interface: 'tags',
                    note: 'A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignored.',
                },
            },
            {
                field: 'revision_fields',
                name: 'Fields with Revisions',
                type: 'csv',
                meta: {
                    width: 'full',
                    interface: 'tags',
                    note: 'A comma separated list of the properties to be returned along with their history of previous values. If any of the specified properties are not present on the requested object(s), they will be ignored.',
                },
            },
            {
                field: 'associations',
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
            const { id, fields, revision_fields, associations, archived, id_property } = params;
            return client.fetchRequest(`/crm/v3/objects/${endpoint}/${id}?archived=${archived}${fields??`&properties=${fields}`}${revision_fields??`&propertiesWithHistory=${revision_fields}`}${associations??`&associations=${associations}`}${id_property??`&idProperty=${id_property}`}`, 'GET');
        },
    };
};