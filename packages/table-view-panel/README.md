# Directus Panel Table View

Output data from across multiple tables using this extension.

![Choose Collection to Include](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/table-view-panel/docs/table-view-panel-feature.jpg)

## Usage

A table will show within the given space on a panel. Click on a row to open the editor where you can see the full record and make changes if permissions allow.

You can resort the table but clicking on the sort icon next to each header. The sorts changes between Ascending, Descending, Disable Sorting which revents to the original sort option.

If the table is larger than the allocated space, you can scroll across to reveal hidden columns and you can also scroll vertically to reveal hidden rows. The header is sticky so it will remain visivble at all times.

You can change the following options:

- Collection Selection
- Field Selection including Relational Fields
- Table Limit
- Filters
- Sort field & direction
- Editing in Side Panel

## Requirements

- Directus 10.10.0+

## Installation

Refer to the Official Guide for details on installing the extension from the Marketplace or manually.

## How to add this Panel

1. Create a new Panel and select **Table View** from the list
2. Choose the collection and fields that you would like to include on the panel as well as the sort field
3. (Optional) Change the limit to the desired amount
4. (Optional) Use the header to create a name for this panel
5. Save the panel and position/resize as required
6. Save the dashboard

![Choose Collection to Include](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/table-view-panel/docs/table-view-panel-customize.jpg)

## Permissions

This extension uses the current session permissions and will only show the permitted data.
