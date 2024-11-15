export const del = (endpoint: string) => {
    return {
        label: 'Delete Record',
        description: 'Remove an existing record from HubSpot.',
        icon: 'delete',
        method: 'DELETE',
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
                    note: 'The ID from Hubspot for the record you want to delete.',
                    required: true,
                },
            }
        ],
        handler: async (client: any, params: any) => {
            const { id } = params;
            return client.fetchRequest(`/crm/v3/objects/${endpoint}/${id}`, 'DELETE');
        },
    };
};