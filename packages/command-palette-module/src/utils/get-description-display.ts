import type { DescriptionDisplay } from '../types';

interface FieldsStore {
	getField: (collection: string, field: string) => unknown;
}

interface DisplayField {
	type?: string;
	meta?: {
		display?: string | null;
		display_options?: Record<string, unknown> | null;
		interface?: string | null;
		options?: Record<string, unknown> | null;
	} | null;
}

// Displays that render from the field's own value. Relational and custom displays need nested fields or cost more,
// so those descriptions stay highlighted text. So do filesize and mime-type: core ships them as functional components,
// whose errors carry no instance, so the description boundary couldn't tell which row failed.
const SIMPLE_DISPLAYS = new Set([
	'boolean',
	'collection',
	'color',
	'datetime',
	'formatted-json-value',
	'formatted-value',
	'hash',
	'icon',
	'labels',
	'rating',
]);

/**
 * The display a description field renders through (a labels badge, a formatted date) instead of highlighted text,
 * with the props core's render-template passes it. Fields without a display get core's `formatted-value`, which only
 * shows the text, so they stay plain, as does an explicit `formatted-value` without options.
 */
export function getDescriptionDisplay(
	fieldsStore: FieldsStore,
	collection: string,
	fieldKey: string,
): DescriptionDisplay | null {
	const field = fieldsStore.getField(collection, fieldKey) as DisplayField | null;
	const meta = field && typeof field === 'object' ? field.meta : null;
	const display = meta?.display;
	if (!meta || !display || !SIMPLE_DISPLAYS.has(display)) return null;
	if (display === 'formatted-value' && !hasOptions(meta.display_options)) return null;

	return {
		component: `display-${display}`,
		props: {
			...meta.display_options,
			interface: meta.interface,
			interfaceOptions: meta.options,
			type: field?.type,
			collection,
			field: fieldKey,
		},
	};
}

function hasOptions(options: Record<string, unknown> | null | undefined) {
	return Object.values(options ?? {}).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
}

// false and 0 are real values (a boolean's "off" label, a zero rating), so only missing or empty text hides a description.
export function hasDescriptionValue(value: unknown) {
	return value !== null && value !== undefined && value !== '';
}
