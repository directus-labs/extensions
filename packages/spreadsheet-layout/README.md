# Spreadsheet Layout for Directus

A spreadsheet layout that allows you to edit item fields directly inline, just like in a spreadsheet.

![](https://raw.githubusercontent.com/directus-labs/extensions/main/packages/spreadsheet-layout/docs/preview.png)

## Installation & Setup

To install the extension, take a look at the [Official Guide](https://docs.directus.io/extensions/installing-extensions.html).

Once installed, go to your collection page, on the `Layout Options` tab in the sidebar, select `Spreadsheet` from the `Layout` drop-down list.

### Layout Options

`Save`: If the `Automatic` checkbox is `checked`, your changes will be saved automatically. If it is `unchecked` you will have to manually press the Save button that appears on the top right corner (or use the keyboard shortcut `[cmd] + [s]`) to save your changes.

`Spacing`: Change the spacing of the spreadsheet rows as you would in the default table layout.

## Usage

Click a cell within the collection spreadsheet and press `[Enter]` or `Double-click` to enter the field and make your change. When you exit the cell by clicking outside it or pressing `[Escape]`, the field value is updated if you have autosave enabled. Otherwise, the cell appears as edited. You can use the arrow keys to navigate through the cells. You can add fields/columns using the `+`-button in the upper right corner of the collection spreadsheet, just like in the default table layout.

## Allowed fields

**Types:** string, text, bigInteger, integer, float, decimal, boolean, dateTime, date, time, timestamp.

**Interfaces:** boolean, datetime, input, input-autocomplete-api, select-color, select-dropdown, select-icon, slider.
