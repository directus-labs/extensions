import { Relation } from '@directus/types';
import { getRelation, getRelationType } from '@directus/utils';

export function getRelationInfo(relations: Relation[], collection: string, field: string) {
	const relation = getRelation(relations, collection, field) ?? null;

	if (relation) {
		const relationType = getRelationType({ relation, collection, field });

		if (!relationType) return null;

		let rcollection = relation.related_collection;
		let rfield = relation.field;

		if (relationType === 'o2m') {
			rcollection = relation.collection;
		} else if (relationType === 'm2a') {
			if (relation.meta?.one_collection_field) {
				rcollection = relation.meta?.one_collection_field;
			}

			if (relation.meta?.many_field) {
				rfield = relation.meta?.many_field;
			}
		}

		return {
			type: relationType,
			collection: rcollection,
			payloadField: rfield,
			junctionField: relation.meta?.junction_field,
		};
	}

	return null;
}
