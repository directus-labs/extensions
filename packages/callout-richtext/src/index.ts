import type { CalloutType } from './callout';
import { defineRichText } from '@directus/extensions-sdk';
import { Callout, CALLOUT_TYPES } from './callout';
import './styles.css';

const ICONS: Record<CalloutType, string> = {
	info: 'info',
	success: 'check_circle',
	warning: 'warning',
	danger: 'error',
};

export default defineRichText({
	id: 'callout',
	// "callout" is not a core translation key, so an admin adds it in Settings → Translations
	name: '$t:callout',
	extensions: [Callout],
	buttons: [
		{
			key: 'callout',
			icon: 'info',
			label: '$t:callout',
			items: CALLOUT_TYPES.map((type) => ({
				key: type,
				label: `$t:${type}`,
				icon: ICONS[type],
				command: (editor) => editor.chain().focus().toggleCallout(type).run(),
				isActive: (editor) => editor.isActive('callout', { calloutType: type }),
			})),
		},
	],
});
