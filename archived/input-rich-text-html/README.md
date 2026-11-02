# DEPRECATED

> **This boilerplate is no longer maintained.** It copies the old TinyMCE-based WYSIWYG interface.
> To add custom features to the WYSIWYG interface in Directus 12.6.0 or later, build a [rich text extension](https://directus.com/docs/guides/extensions/app-extensions/richtext) instead. Use [Callout Richtext](https://github.com/directus-labs/extensions/tree/main/packages/callout-richtext) or [YouTube Richtext](https://github.com/directus-labs/extensions/tree/main/packages/youtube-richtext) as a starting point.

---

# Customizable WYSIWYG Interface Extension for Directus

This interface extension is based on the core interface. Use this code as a base for your customizations.

## Example: Adding a custom toolbar button to TinyMCE

1. Add the toolbar button name to the toolbar string

    https://github.com/directus-labs/extensions/blob/main/archived/input-rich-text-html/src/input-rich-text-html.vue#L182

2. Register the toolbar button

    https://github.com/directus-labs/extensions/blob/main/archived/input-rich-text-html/src/input-rich-text-html.vue#L301-L304
