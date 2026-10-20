# Callout Rich Text Extension

Add callout blocks to the WYSIWYG interface. A callout holds paragraphs, lists, and other blocks, and has one of four types: info, success, warning, or danger.

This extension is also a reference for the [rich text extension type](https://directus.com/docs/guides/extensions/app-extensions/richtext). Copy it as a starting point for your own nodes.

## Requirements

Directus 12.6.0 or later.

## Installation

Refer to the [Official Guide](https://directus.com/docs/self-hosting/including-extensions) for details on installing the extension from the Marketplace or manually.

## Usage

1. Open the settings of a field that uses the WYSIWYG interface.
2. In **Extensions**, select **Callout**.
3. In **Toolbar**, select the **Callout** button.
4. Save the field.

In the editor, select one or more blocks, open the **Callout** dropdown, and select a type. Select a different type to change it. Select the active type again to remove the callout.

## Translations

The four type labels use translation keys that Directus already has, so they show in the user's language.

The extension name and the button label use the `callout` key. Directus has no translation for this key, so the label shows as `callout` until you add one:

1. Go to **Settings → Translations**.
2. Create a translation with the key `callout`.
3. Add a value for each language, for example `Callout` for English.

## Stored HTML

The field saves each callout as an `aside` element. The `data-callout` attribute holds the type.

```html
<aside data-callout="warning">
	<p>Back up your database before you upgrade.</p>
</aside>
```

## Style Callouts on Your Frontend

The extension styles callouts in the Data Studio only. Your frontend renders the stored HTML, so add matching styles there.

```css
aside[data-callout] {
	margin-block: 1em;
	padding: 0.75em 1em;
	border-inline-start: 4px solid #6644ff;
	border-radius: 6px;
	background-color: #f0ecff;
}

aside[data-callout='success'] {
	border-inline-start-color: #2ecda7;
	background-color: #eafaf6;
}

aside[data-callout='warning'] {
	border-inline-start-color: #ffa439;
	background-color: #fff6eb;
}

aside[data-callout='danger'] {
	border-inline-start-color: #e35169;
	background-color: #fcedf0;
}
```

## Use It as a Starting Point

- `src/callout.ts` defines the Tiptap node and its `toggleCallout` command. It imports `@tiptap/core` directly. The extensions SDK does not bundle it, so the extension uses the Data Studio's copy of Tiptap.
- `parseHTML` reads back exactly the markup that `renderHTML` writes. If they differ, every save of the field warns the user that saving alters the content.
- Do not name an attribute after one that the core editor keeps on every element, such as `class`, `id`, or `title`. Directus does not load an extension that does.
- `src/styles.css` scopes every rule under `.richtext-content`, so the styles apply in edit mode, read-only mode, and the comparison view.
- The `host` range in `package.json` is a caret range on the first Directus version with rich text extensions. A new Tiptap major version ships only in a new Directus major version, and the range stops there.
