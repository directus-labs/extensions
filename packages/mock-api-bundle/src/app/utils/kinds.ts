const METHOD_KINDS: Record<string, string> = {
	GET: 'success',
	POST: 'warning',
	PUT: 'warning',
	PATCH: 'info',
	DELETE: 'danger',
};

export function methodKind(method: string): string {
	return METHOD_KINDS[method] ?? 'neutral';
}

export function statusKind(status: number): string {
	if (status === 0 || status >= 400) return 'danger';
	if (status >= 300) return 'info';
	return 'success';
}
