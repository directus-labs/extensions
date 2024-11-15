# HubSpot API Operation

The HubSpot Operation allows you to integrate their API into Directus flows.

![Hubspot API Operation](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/hubspot-operation/docs/hubspot-operation.png)

## Endpoints

- Activities
- Calls
- Communications
- Companies
- Contacts
- Deals
- Email
- Leads
- Meetings
- Notes
- Products
- Tasks
- Tickets

## Usage

1. Obtain an API Access Token from HubSpot. See [HubSpot Private App](https://developers.hubspot.com/beta-docs/guides/apps/private-apps/overview) for instructions.
2. In your Directus flow, create a new operation and choose HubSpot API from the list.
3. Copy and paste the API Access token from HubSpot into the required field. It's worth noting the token somewhere safe because you will need it when creating more HubSpot operations.
4. Choose a endpoint to use from the dropdown list
5. Choose and action to perform. The Actions dropdown list will update with the available actions for the selected endpoint.
6. New fields will appear relevant to the action. Populate these fields as needed.

## Requirements

- Directus 10.10.0+
- HubSpot Account (Free or Paid)
- Private App Access Token

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## Permissions

This operation relies on the permissions of the API Access Token. Please make sure to assign the required permissions beforehand.

| Endpoint(s) | Scopes |
| -------- | ------ |
| Calls<br/>Communications<br/>Contacts<br/>Meetings<br/>Tasks | `crm.objects.contacts.read`<br/>`crm.objects.contacts.write`<br/>&nbsp;<br/>&nbsp;<br/>&nbsp; |
| Companies<br/>&nbsp; | `crm.objects.companies.read`<br/>`crm.objects.companies.write` |
| Email<br/>&nbsp; | `sales-email-read` &amp; `crm.objects.contacts.read`</br>`crm.objects.contacts.write`</br> |
| Deals<br/>&nbsp; | `crm.objects.deals.read`<br/>`crm.objects.deals.write` |
| Leads<br/>&nbsp; | `crm.objects.leads.read`<br/>`crm.objects.leads.write` |
| Products | `e-commerce` |
| Tickets | `tickets` |

## Fields

For more detailed information about the HubSpot API and its capabilities, please refer to the [HubSpot API reference](https://developers.hubspot.com/beta-docs/reference/api/).

### Create

#### Associations

Associations represent the relationships between objects and activities in the HubSpot CRM. Record associations can exist between records of different objects (e.g., Contact to Company), as well as within the same object (e.g., Company to Company).

When creating a new item, you can also associate the item with existing records or activities by including an associations object. For example, to associate a new contact with an existing company and email, your request would look like the following:

```
association: [
  {
    "to": {
      "id": 123456  <--- ID of the existing item
    },
    "types": [
      {
        "associationCategory": "HUBSPOT_DEFINED",
        "associationTypeId": 279  <---- ID of the category
      }
    ]
  }
]
```


#### Properties

Use properties to store information on CRM records. HubSpot provides a set of default properties for each CRM object, and you can also create and manage your own custom properties in the HubSpot Data Model. Check out the [properties guide](https://developers.hubspot.com/beta-docs/guides/api/crm/properties) in HubSpot's documentation and familiarize yourself with the default properties for each endpoint.

Be mindful that some properties have fixed values that are allowed. Make sure to use these values when creating or updating records.

```
{
  "firstname": "Jane",
  "surname": "Smith",
  "email": "j.smith@example.com"
}
```


## Security Considerations

- Keep your HubSpot API access key secure and never expose it in client-side code.
- Use Directus roles and permissions to control access to this operation.
- Be cautious when dealing with sensitive user data.
- Consider rotating the API access key to maintain security.

## Error Handling

The operation will throw an error if the API returns an error response. Make sure to handle these errors appropriately in your flows.

Detailed Error responses can be found in the HubSpot private app details and within the Directus Flow log.

---
