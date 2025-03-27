# Algolia Operation

Use Algolia to index and search your data with Directus Flows. This Operation allows you to create, update, delete and even search records in your index. 

![Screenshot of the Algolia Operation in action](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/algolia-operation/docs/screenshot.png)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

## Usage

Once installed, add the Algolia Operation to your flow. Then fill the required options and select which action you would like to perform.

| Field   | Description  |
|---------|--------------------|
| Application ID | Your Algolia application ID found in your [dashboard](https://dashboard.algolia.com/account) |
| API Key | A key with sufficient permissions, also found in your [dashboard](https://dashboard.algolia.com/account) |
| Index | Name of the index on which to perform the action you select. |
| Action | Which action to perform: Add or replace record, Add or update attributes, Delete record, Retrieve record or Search |

### Add or replace record

Creates a record, or if a record already exist with the same Object ID, replace it with a new object.

| Field   | Description  |
|---------|--------------------|
| Object ID | Unique record identifier |
| Body | An object with fields that are useful for search and discovery |

#### Example usage

1. Create an Event Hook flow that is triggered on `item.create` and choose which collection to include (if you select multiple collections, you can use `{{$trigger.collection}}` in the Index field).
2. Add the Algolia Operation and Object ID to `{{$trigger.key}}`
3. Add which attributes you want to save in the Body field.

### Add or update attributes

Adds new attributes to a record, or update existing ones.

| Field   | Description  |
|---------|--------------------|
| Object ID | Unique record identifier |
| Body | Attributes to update. It is also possible to update attributes with Algolia's [built-in operations](https://www.algolia.com/doc/rest-api/search/#tag/Records/operation/partialUpdateObject). |

#### Example usage

1. Create an Event Hook flow that is triggered on `item.update` and choose which collection to include (if you select multiple collections, you can use `{{$trigger.collection}}` in the Index field).
2. Add the Algolia Operation and Object ID to `{{$trigger.keys[0]}}`
3. Add which attributes you want to save in the Body field.

### Delete record

Removes a record from the index.

| Field   | Description  |
|---------|--------------------|
| Object ID | Unique record identifier |

#### Example usage

1. Create an Event Hook flow that is triggered on `item.delete` and choose which collection to include (if you select multiple collections, you can use `{{$trigger.collection}}` in the Index field).
2. Add the Algolia Operation and Object ID to `{{$trigger.keys[0]}}`

### Retrieve record

Retrieve a record by its Object ID. The Operation will contain all attributes that are currently saved in the record.

| Field   | Description  |
|---------|--------------------|
| Object ID | Unique record identifier |

### Search

Search for records in your index. Results will be returned in the `hits` array.

| Field   | Description  |
|---------|--------------------|
| Search Parameters | See [Algolia Documentation](https://www.algolia.com/doc/rest-api/search/#tag/Search) for details. |