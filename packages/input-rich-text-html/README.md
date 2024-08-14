# Customizable WYSIWYG Interface Extension for Directus

This interface extension is based on the core interface. Use this code as a base for your customizations.

## Example: Adding a custom toolbar button to TinyMCE

1. Add the toolbar button name to the toolbar string

    https://github.com/directus-labs/extensions/blob/cc0d8fcf2503a5be940bfee13d3e0c022494e106/packages/input-rich-text-html/src/input-rich-text-html.vue#L182

2. Register the toolbar button

    https://github.com/directus-labs/extensions/blob/cc0d8fcf2503a5be940bfee13d3e0c022494e106/packages/input-rich-text-html/src/input-rich-text-html.vue#L301-L304
