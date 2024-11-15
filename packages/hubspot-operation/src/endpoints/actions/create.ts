import schema from '../schema';
export const create = (endpoint: string) => {
    return {
        label: 'Create Record',
        description: `Create a new record in HubSpot.${endpoint == 'leads'?' Must be associated with an existing contacts.':''}`,
        icon: 'add',
        method: 'POST',
        path: `/crm/v3/objects/${endpoint}`,
        options: [
            {
                field: 'associations',
                name: 'Associations',
                type: 'json',
                meta: {
                    width: 'full',
                    interface: 'input-code',
                    note: 'Link this contact with other records in HubSpot',
                    options: {
                        language: 'json',
                        placeholder: JSON.stringify(schema.associations),
                        template: JSON.stringify(schema.associations),
                    }
                },
            },
            {
                field: 'properties',
                name: 'Properties',
                type: 'json',
                meta: {
                    width: 'full',
                    interface: 'input-code',
                    note: `Information to include in the new record. Fill with template value to see an example or visit the [API Reference](https://developers.hubspot.com/beta-docs/guides/api/crm/${['calls','communications','email','meetings','notes','tasks'].includes(endpoint)?'engagements':'objects'}/${endpoint}) for more information.`,
                    options: {
                        language: 'json',
                        placeholder: JSON.stringify(schema.properties[endpoint]),
                        template: JSON.stringify(schema.properties[endpoint]),
                    }
                },
            },
        ],
        handler: async (client: any, params: any) => {
            const { associations, properties } = params;
            return client.fetchRequest(`/crm/v3/objects/${endpoint}`, 'POST', {
                associations,
                properties
            });
        },
    };
};