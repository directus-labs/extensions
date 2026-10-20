# YouTube Rich Text Extension

Embed YouTube videos in the WYSIWYG interface. The extension wraps the official [Tiptap YouTube extension](https://tiptap.dev/docs/editor/extensions/nodes/youtube) with no changes to its code, and embeds videos from the privacy-enhanced `youtube-nocookie.com` domain.

This extension is also a reference for how to [wrap an existing Tiptap package](https://directus.com/docs/guides/extensions/app-extensions/richtext#wrap-an-existing-tiptap-package) in a rich text extension.

## Requirements

Directus 12.6.0 or later.

## Installation

Refer to the [Official Guide](https://directus.com/docs/self-hosting/including-extensions) for details on installing the extension from the Marketplace or manually.

## Usage

1. Open the settings of a field that uses the WYSIWYG interface.
2. In **Extensions**, select **YouTube**.
3. In **Toolbar**, select the **Embed YouTube video** button.
4. Save the field.

In the editor, click the button and paste a YouTube URL.

## Stored HTML

The field saves each video as an `iframe` inside a `div` with a `data-youtube-video` attribute.

```html
<div data-youtube-video="">
	<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=1" width="640" height="480" allowfullscreen="true"></iframe>
</div>
```

## Use It as a Starting Point

- `src/index.ts` imports the package and adds it to `extensions`. The extensions SDK bundles the package code, but keeps its `@tiptap/core` import on the Data Studio's copy.
- The core editor parses `iframe` elements as media. `.extend({ priority: 1000 })` makes the YouTube rule run first. Without it, saved videos load as a media node, not as a YouTube video.
- `@tiptap/extension-youtube` is pinned to the Tiptap version that Directus ships. A newer Tiptap minor version can import a function that the Data Studio's copy does not have yet.
