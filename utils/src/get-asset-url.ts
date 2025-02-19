import { getPublicURL } from './get-root-path';

/**
 * Get the full URL for an asset
 * @param filename - Filename of the asset
 * @param isDownload - Whether to add a download parameter to the URL
 * @returns - Full URL for the asset
 */
export function getAssetUrl(filename: string, isDownload?: boolean): string {
	const assetUrl = new URL(`assets/${filename}`, getPublicURL());

	if (isDownload) {
		assetUrl.searchParams.set('download', '');
	}

	return assetUrl.href;
}
