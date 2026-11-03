export function errorBody(message: string, code: string, extensions: Record<string, unknown> = {}) {
	return { errors: [{ message, extensions: { code, ...extensions } }] };
}
