// Directus reserves the directus_ prefix for system collections.
export function getEndpoint(collection: string): string {
	if (collection.startsWith('directus_')) return `/${collection.slice(9)}`;

	return `/items/${collection}`;
}
