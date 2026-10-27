import { defineRichText } from '@directus/extensions-sdk';
import { Youtube } from '@tiptap/extension-youtube';

export default defineRichText({
	id: 'youtube',
	name: 'YouTube',
	// core parses iframes as media, so the YouTube rule must run first
	extensions: [Youtube.extend({ priority: 1000 }).configure({ nocookie: true })],
	buttons: [
		{
			key: 'embed',
			icon: 'smart_display',
			label: 'Embed YouTube video',
			command: (editor) => {
				// eslint-disable-next-line no-alert -- keeps the example free of UI code
				const src = window.prompt('YouTube URL');
				if (src) editor.chain().focus().setYoutubeVideo({ src }).run();
			},
		},
	],
});
