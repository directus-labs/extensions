# Customizable Block Editor Interface Extension for Directus

This interface extension is based on the core interface. Use this code as a base for your customizations.

## Example: Adding an Editor.js extension

In this example, we will add the Editor.js [marker tool extension](https://github.com/editor-js/marker).

1. Install the package `npm add -D @editorjs/marker`
2. Add an option to the interface settings

    https://github.com/directus-labs/extensions/blob/main/boilerplates/input-block-editor/src/index.ts#L77-L80

    > **NOTE:** To have this option and the tool enabled by default, be sure to add `marker` to the `schema.default_value` array: https://github.com/directus-labs/extensions/blob/main/boilerplates/input-block-editor/src/index.ts#L57

3. Import the package

    https://github.com/directus-labs/extensions/blob/main/boilerplates/input-block-editor/src/tools.ts#L17

4. Add the tool

    https://github.com/directus-labs/extensions/blob/main/boilerplates/input-block-editor/src/tools.ts#L102-L105
