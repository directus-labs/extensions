/**
 * Check if a path is an SVG
 * @param {string | undefined} path - The path to check
 * @returns {boolean} - True if the path is an SVG, false otherwise
 */
export function isSVG(path: string | undefined) {
	return path?.startsWith('<svg');
}
