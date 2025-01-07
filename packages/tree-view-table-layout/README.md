# Tree View Table Layout

A tree view layout that allows you to nest items within a table.

![Demo of the Tree View Table Layout](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/tree-view-table-layout/docs/demo.gif)

## Installation

Refer to the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html) for details on installing the extension from the Marketplace or manually.

Once installed, go to your collection page, on the `Layout Options` tab in the sidebar, select `Tree View Table` from the `Layout` drop-down list.

### Layout Options

`Parent (M2O)`: Select a M2O field that references the same collection. Create one if it is not listed. Note that the select field only appears if you have specified a `sort` field in your collections data model settings!

`Spacing`: Change the spacing of the spreadsheet rows as you would in the default table layout.

## Usage

To use the Tree View Table features, make sure the `Parent (M2O)` field is set correctly and manual sorting is enabled! Use the drag handles to change the order of your items and move them horizontally to nest items. When you nest an item, a collapse button appears.

### Things to note

-   The sort event is not fired with this implementation, but instead you could listen for an update event on the `sort` or `parent` fields via a hook extension or flow.
-   This implementation does not support touch devices as of this writing.
