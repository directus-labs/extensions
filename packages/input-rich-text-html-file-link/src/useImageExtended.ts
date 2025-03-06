import type { File, SettingsStorageAssetPreset } from '@directus/types';
import type { Ref } from 'vue';
// CORE-CHANGE end
// @ts-expect-error: Missing types
import mime from 'mime/lite';
import { ref, watch } from 'vue';
// CORE-CHANGE start
// import { i18n } from '@/lang';
// import { addQueryToPath } from "@/utils/add-query-to-path";
import { addQueryToPath } from './core-clones/utils/add-query-to-path';
// import { getPublicURL } from '@/utils/get-root-path';
import { getPublicURL } from './core-clones/utils/get-root-path';
// import { readableMimeType } from "@/utils/readable-mime-type";
import { readableMimeType } from './core-clones/utils/readable-mime-type';

interface ImageExtendedSelection {
	imageUrl: string;
	alt: string;
	lazy?: boolean;
	width?: number | null;
	height?: number | null;
	transformationKey?: string | null;
	previewUrl?: string;
	displayText?: string | null;
	tooltip?: string | null;
	target?: boolean | null;
	download?: boolean;
}

interface FileLinkButton {
	icon: string;
	tooltip: string;
	onAction: (buttonApi: any) => void;
	onSetup: (buttonApi: any) => () => void;
}

interface UsableImage {
	imageExtendedDrawerOpen: Ref<boolean>;
	imageExtendedSelection: Ref<ImageExtendedSelection | null>;
	closeImageExtendedDrawer: () => void;
	onImageExtendedSelect: (image: File) => void;
	saveImageExtended: () => void;
	fileLinkButton: FileLinkButton;
}

export default function useImage(
	editor: Ref<any>,
	imageToken: Ref<string | undefined>,
	options: {
		storageAssetTransform: Ref<string>;
		storageAssetPresets: Ref<SettingsStorageAssetPreset[]>;
	},
): UsableImage {
	const imageExtendedDrawerOpen = ref(false);
	const imageExtendedSelection = ref<ImageExtendedSelection | null>(null);
	const selectedPreset = ref<SettingsStorageAssetPreset | undefined>();

	watch(
		() => imageExtendedSelection.value?.transformationKey,
		(newKey) => {
			selectedPreset.value = options.storageAssetPresets.value.find(
				(preset: SettingsStorageAssetPreset) => preset.key === newKey,
			);

			if (selectedPreset.value) {
				imageExtendedSelection.value!.width
                    = selectedPreset.value.width ?? undefined;

				imageExtendedSelection.value!.height
                    = selectedPreset.value.height ?? undefined;
			}
		},
	);

	const fileLinkButton = {
		icon: 'non-breaking',
		tooltip: 'Add/Edit File Link',
		// CORE-CHANGE end
		onAction: (buttonApi: any) => {
			imageExtendedDrawerOpen.value = true;

			if (buttonApi === true || buttonApi.isActive()) {
				const node
                    = editor.value.selection.getNode() as HTMLImageElement;

				const imageUrl = node.getAttribute('src');

				const imageUrlParams = imageUrl
					? new URL(imageUrl).searchParams
					: undefined;

				const alt = node.getAttribute('alt');
				const lazy = node.getAttribute('loading') === 'lazy';
				const displayText = node.getAttribute('data-display-text');
				const tooltip = node.getAttribute('data-tooltip');
				const target = !!node.getAttribute('data-target');

				const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
				const height = Number(imageUrlParams?.get('height') || undefined) || undefined;
				const transformationKey = imageUrlParams?.get('key') || undefined;
				const download = imageUrlParams?.get('download') === 'true';

				if (imageUrl === null || alt === null) {
					return;
				}

				if (transformationKey) {
					selectedPreset.value
                        = options.storageAssetPresets.value.find(
							(preset: SettingsStorageAssetPreset) =>
								preset.key === transformationKey,
						);
				}

				imageExtendedSelection.value = {
					imageUrl,
					alt,
					lazy,
					width: selectedPreset.value
						? selectedPreset.value.width ?? undefined
						: width,
					height: selectedPreset.value
						? selectedPreset.value.height ?? undefined
						: height,
					transformationKey,
					previewUrl: replaceUrlAccessToken(
						imageUrl,
						imageToken.value,
					),
					displayText,
					tooltip,
					target,
					download,
				};
			}
			else {
				imageExtendedSelection.value = null;
			}
		},
		onSetup: (buttonApi: any) => {
			const onImageNodeSelect = (eventApi: any) => {
				buttonApi.setActive(eventApi.element.tagName === 'IMG');
			};

			editor.value.on('NodeChange', onImageNodeSelect);

			return function () {
				editor.value.off('NodeChange', onImageNodeSelect);
			};
		},
	};

	return {
		imageExtendedDrawerOpen,
		imageExtendedSelection,
		closeImageExtendedDrawer,
		onImageExtendedSelect,
		saveImageExtended,
		fileLinkButton,
	};

	function closeImageExtendedDrawer() {
		imageExtendedSelection.value = null;
		imageExtendedDrawerOpen.value = false;
	}

	function onImageExtendedSelect(image: File) {
		const fileExtension = image.type
			? readableMimeType(image.type, true)
			: readableMimeType(
					mime.getType(image.filename_download) as string,
					true,
				);

		const assetUrl
            = `${getPublicURL()}assets/${image.id}.${fileExtension}`;

		imageExtendedSelection.value = {
			imageUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
			alt: image.title!,
			lazy: false,
			width: image.width,
			height: image.height,
			previewUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
			displayText: '',
			tooltip: '',
			target: false,
			download: false,
		};
	}

	function saveImageExtended() {
		editor.value.fire('focus');

		const img = imageExtendedSelection.value;
		if (img === null)
			return;

		const queries: Record<string, any> = {};
		const newURL = new URL(img.imageUrl, 'file://');

		newURL.searchParams.delete('width');
		newURL.searchParams.delete('height');
		newURL.searchParams.delete('key');
		newURL.searchParams.delete('download');

		if (options.storageAssetTransform.value === 'all') {
			if (img.transformationKey) {
				queries.key = img.transformationKey;
			}
			else {
				queries.width = img.width;
				queries.height = img.height;
			}
		}
		else if (options.storageAssetTransform.value === 'presets') {
			if (img.transformationKey) {
				queries.key = img.transformationKey;
			}
		}

		if (img.download) {
			queries.download = 'true';
		}

		const resizedImageUrl = addQueryToPath(
			newURL.toString().replace('file://', ''),
			queries,
		);

		const imageHtml = `<img src="${resizedImageUrl}"
			alt="${img.alt}"
			${img.lazy ? 'loading="lazy"' : ''}
			${img.displayText ? `data-display-text="${img.displayText}"` : ''}
			${img.tooltip ? `data-tooltip="${img.tooltip}"` : ''}
			${img.target ? `data-target=${!!img.target}` : ''}
		/>`;

		editor.value.selection.setContent(imageHtml);
		editor.value.undoManager.add();
		closeImageExtendedDrawer();
	}

	function replaceUrlAccessToken(
		url: string,
		token: string | null | undefined,
	): string {
		// Only process assets URL
		if (!url.includes(`${getPublicURL()}assets/`)) {
			return url;
		}

		try {
			const parsedUrl = new URL(url);
			const params = new URLSearchParams(parsedUrl.search);

			if (!token) {
				params.delete('access_token');
			}
			else {
				params.set('access_token', token);
			}

			return Array.from(params).length > 0
				? `${parsedUrl.origin}${
					parsedUrl.pathname
				}?${params.toString()}`
				: `${parsedUrl.origin}${parsedUrl.pathname}`;
		}
		catch {
			return url;
		}
	}
}
