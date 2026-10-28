export function getRouteQueryValue(value: unknown): string | undefined {
	if (Array.isArray(value)) return getRouteQueryValue(value[0]);
	return typeof value === 'string' && value.length > 0 ? value : undefined;
}
