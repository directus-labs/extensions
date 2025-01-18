# Inline Repeater Interface

![Inline Repeater Interface](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/inline-repeater-interface/docs/inline-repeater-interface.png)

A powerful interface for managing repeatable form fields within Directus that allows inline editing and reordering of items.

An alternative to the core [Repeater Interface](https://directus.io/docs/guides/data-model/interfaces#repeater) that opens inline as opposed to a drawer.

Note: This interface is for JSON fields only and doesn't support validation.

## Features

- Inline editing of repeatable fields
- Drag and drop reordering
- Expandable/collapsible accordion items
- Customizable field templates
- Confirmation dialogs for item removal
- Expand/Collapse all functionality

## Usage

![Inline Repeater Example](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/inline-repeater-interface/docs/inline-repeater-example.png)

The interface presents a list of repeatable items that can be:
1. Added using the "Add New" button
2. Expanded/collapsed for editing
3. Reordered via drag and drop
4. Removed with confirmation (optional)

## Installation and Setup

Follow the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for installing extensions from the Marketplace or manually.

## Configuration Options

The interface can be extensively customized through its configuration panel:

![Inline Repeater Interface Configuration](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/inline-repeater-interface/docs/inline-repeater-interface-config.png)

![Inline Repeater Interface Fields Configuration](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/inline-repeater-interface/docs/inline-repeater-interface-fields-config.png)

### Fields Configuration
- Define custom fields with:
  - Field name
  - Field width (half/full)
  - Field type
  - Required status
  - Interface selection
  - Interface options
  - Display configuration
  - Field notes

### Display Options
- **Template**: Customize how items are displayed in the collapsed state
- **Add Label**: Customize the "Add New" button text
- **Sort**: Enable automatic sorting of items by a specific field
- **Limit**: Set maximum number of items
- **Require Confirmation to Remove**: Shows a confirmation dialog when removing items


### Example Configuration
```json
{
	"fields": [
		{
			"field": "title",
			"type": "string",
			"interface": "input",
			"width": "full",
			"required": true
		},
		{
			"field": "description",
			"type": "text",
			"interface": "textarea",
			"width": "full"
		}
	],
	"template": "{{title}}",
	"addLabel": "Add Item",
	"showConfirmDiscard": true
}
```
