# Directus Field Comments

Leave comments on individual fields

![Field Comments](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/field-comments-module/docs/field-comments.jpg)

## Usage

Once installed and configured, all included fields will show the comment icon next to the field label to identify which fields can accept comments. A badge will appear on this icon when comments have been left for that field.

Click on this icon to open the comments feed where you can read through the comments or leave a new comment of you own. You can use the @ symbol to tag and notify other users and also use emojis.

_Please note, comments do not appear when creating a new item. It must be saved first, before comments can be added._

![Field Comments](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/field-comments-module/docs/field-comments-screenshot.jpg)

## Requirements

- Directus 11.1.2+
- Admin user to initialize module
- Permissions added to the new system table for participants

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to configure this module

1. Go to the project settings `/admin/settings/project` and scroll to the bottom
2. Click Add Collection
3. Choose a collection from the dropdown field
4. Select the field to include
5. Save changes
6. Open the Access Policies and add permissions to read, write and update the new collection `system_field_comments`

When opening the project settings for the first time, the module will automatically add the new setting option to the page and create the required system table. 

![Customise the module](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/field-comments-module/docs/field-comments-customize.jpg)


## Permissions

This extension uses the current session permissions and will only show the permitted data. Please refer to your Access Policies to ensure your users have required access.

### Recommended Permissions

| Collection | `create` | `read` | `update` | `delete` |
|------------|----------|--------|----------|----------|
| `directus_comments` | Default | All | Default* | Default* |
| `system_field_comments` | Full | Full | Full | - |

_(*) The default update and delete has the following item permission. It's important to keep these settings as they are to prevent user's from changing or deleting comments of other users._

```
{
    user_created: {
        "_eq": "$CURRENT_USER"
    }
}
```
