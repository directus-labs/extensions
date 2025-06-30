import { useStores } from '@directus/extensions-sdk';

export interface FieldMeta {
	collection: string;
	field: string;
	primaryKey: string;
	interface?: string;
}

export function useFieldMeta() {
	const { useFieldsStore } = useStores();
	const fieldsStore = useFieldsStore();

	function getFieldMetaFromPayload({
		collection,
		field,
		primaryKey,
	}: {
		collection: string;
		field: string;
		primaryKey: string;
	}): FieldMeta | null {
		// Look for elements with ALL required attributes
		if (collection && field && primaryKey) {
			const fieldInfo = fieldsStore.getField(collection, field);

			return {
				collection,
				field,
				primaryKey,
				interface: fieldInfo?.meta?.interface,
			};
		}

		return null;
	}

	return {
		getFieldMetaFromPayload,
	};
}
