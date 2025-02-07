/**
 * Return the deepest object with the given key exploding on dots, and the value assigned to the last key.
 * Example: ("related.title", { "_contains": "abc" }) returns {"related": {"title": { "_contains": "abc" }}}
 */
export function createDeepObject(key: string, value: any): Record<string, any> {
	const keys = key.split('.');
	return keys.reverse().reduce((acc, key) => ({ [key]: acc }), value);
}
