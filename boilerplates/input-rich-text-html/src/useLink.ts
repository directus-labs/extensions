// CORE-CHANGE end
import type { Ref } from 'vue';
import { ref } from 'vue';
// CORE-CHANGE start
// import { i18n } from '@/lang';
import { useI18n } from 'vue-i18n';

interface LinkSelection {
	url: string | null;
	displayText: string | null;
	title: string | null;
	newTab: boolean;
}

interface LinkButton {
	icon: string;
	tooltip: string;
	onAction: (buttonApi: any) => void;
	onSetup: (buttonApi: any) => () => void;
}

interface UsableLink {
	linkDrawerOpen: Ref<boolean>;
	linkSelection: Ref<LinkSelection>;
	linkNode: Ref<HTMLLinkElement | null>;
	closeLinkDrawer: () => void;
	saveLink: () => void;
	linkButton: LinkButton;
}

export default function useLink(editor: Ref<any>): UsableLink {
	const linkDrawerOpen = ref(false);

	const defaultLinkSelection = {
		url: null,
		displayText: null,
		title: null,
		newTab: true,
	};

	const linkSelection = ref<LinkSelection>(defaultLinkSelection);
	const linkNode: Ref<HTMLLinkElement | null> = ref(null);
	const currentSelectionNode = ref<HTMLElement | null>(null);

	const linkButton = {
		icon: 'link',
		// CORE-CHANGE start
		// tooltip: i18n.global.t('wysiwyg_options.link'),
		tooltip: useI18n().t('wysiwyg_options.link'),
		// CORE-CHANGE end
		onAction: () => {
			if (editor.value.plugins.fullscreen.isFullscreen()) {
				editor.value.execCommand('mceFullScreen');
			}

			linkDrawerOpen.value = true;

			if (linkNode.value) {
				editor.value.selection.select(currentSelectionNode.value);

				const url = linkNode.value.getAttribute('href');
				const title = linkNode.value.getAttribute('title');
				const displayText = linkNode.value.textContent;
				const target = linkNode.value.getAttribute('target');

				if (url === null || displayText === null) {
					return;
				}

				linkSelection.value = {
					url,
					displayText,
					title: title || null,
					newTab: target === '_blank',
				};
			}
			else {
				const selectedContent = editor.value.selection.getContent();

				try {
					const url = new URL(selectedContent).toString();
					setLinkSelection({ url });
				}
				catch {
					setLinkSelection({ displayText: selectedContent || null });
				}
			}
		},
		onSetup: (buttonApi: any) => {
			const onLinkNodeSelect = (eventApi: any) => {
				let element = eventApi.element;
				currentSelectionNode.value = eventApi.element;
				linkNode.value = null;

				while (element && element.id !== 'tinymce') {
					if (element.tagName === 'A') {
						linkNode.value = element;
						break;
					}

					element = element.parentElement;
				}

				buttonApi.setActive(!!linkNode.value);
			};

			editor.value.on('NodeChange', onLinkNodeSelect);

			return function () {
				editor.value.off('NodeChange', onLinkNodeSelect);
			};
		},
	};

	return {
		linkDrawerOpen,
		linkSelection,
		linkNode,
		closeLinkDrawer,
		saveLink,
		linkButton,
	};

	function setLinkSelection(
		overrideLinkSelection: Partial<LinkSelection> = {},
	) {
		linkSelection.value = Object.assign(
			{},
			defaultLinkSelection,
			overrideLinkSelection,
		);
	}

	function closeLinkDrawer() {
		setLinkSelection();
		linkDrawerOpen.value = false;
	}

	function saveLink() {
		editor.value.fire('focus');

		const link = linkSelection.value;

		if (link.url === null) {
			if (linkNode.value) {
				editor.value.selection.setContent(linkNode.value.textContent);
				closeLinkDrawer();
			}

			return;
		}

		const linkHtml = `<a href="${link.url}" ${
			link.title ? `title="${link.title}"` : ''
		} ${link.newTab ? 'target="_blank"' : ''} >${
			link.displayText || link.url
		}</a>`;

		// New anchor tag or current selection node is an anchor tag
		if (!linkNode.value || currentSelectionNode.value === linkNode.value) {
			editor.value.selection.setContent(linkHtml);
		}
		// Parent node is an anchor tag
		else if (currentSelectionNode.value) {
			currentSelectionNode.value.innerHTML = link.displayText || link.url;
			linkNode.value.setAttribute('data-mce-href', link.url); // Required for tinymce to update changes
			linkNode.value.setAttribute('href', link.url);
			if (link.title)
				linkNode.value.setAttribute('title', link.title);

			linkNode.value.setAttribute(
				'target',
				link.newTab ? '_blank' : '_self',
			);

			editor.value.selection.select(linkNode.value);
			editor.value.selection.setNode(linkNode.value);
		}

		editor.value.undoManager.add();
		closeLinkDrawer();
	}
}
