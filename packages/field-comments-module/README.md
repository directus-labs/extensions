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
6. Open the Access Policies and configure permissions for the new collection `system_field_comments`. See Permissions section below.

When opening the project settings for the first time, the module will automatically add the new field at the bottom of the page and create the required system table. Permissions need to be added by the admin.

![Customise the module](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/field-comments-module/docs/field-comments-customize.jpg)


## Permissions

This extension uses the current user's policy/role permissions and will only show the permitted data. Please refer to your Access Policies to ensure your users have required access.

### Recommended Permissions

| Collection | `create` | `read` | `update` | `delete` |
|------------|----------|--------|----------|----------|
| `system_field_comments` | Full | Full | Custom* | Custom* |

_(*) The custom update and delete has the following item permissions. It's important these settings as they prevent user's from updating or deleting comments of other users._

#### Item Permissions (Update & Delete)
```
{
    user_created: {
        "_eq": "$CURRENT_USER"
    }
}
```

#### Field Permissions (Update)
```
["comment","user_updated"]
```