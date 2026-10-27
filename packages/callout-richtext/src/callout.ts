import { mergeAttributes, Node } from '@tiptap/core';

export const CALLOUT_TYPES = ['info', 'success', 'warning', 'danger'] as const;

export type CalloutType = (typeof CALLOUT_TYPES)[number];

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		callout: {
			toggleCallout: (type: CalloutType) => ReturnType;
		};
	}
}

export const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	defining: true,
	addAttributes() {
		return {
			calloutType: {
				default: 'info',
				parseHTML: (element) => element.dataset.callout,
				renderHTML: (attributes) => ({ 'data-callout': attributes.calloutType }),
			},
		};
	},
	parseHTML: () => [{ tag: 'aside[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['aside', mergeAttributes(HTMLAttributes), 0],
	addCommands() {
		return {
			toggleCallout:
				(type) =>
					({ editor, commands }) => {
						if (!editor.isActive(this.name)) return commands.wrapIn(this.name, { calloutType: type });
						if (editor.isActive(this.name, { calloutType: type })) return commands.lift(this.name);
						return commands.updateAttributes(this.name, { calloutType: type });
					},
		};
	},
});
