import type { Relation } from '@directus/types';

export function calculateRelation({ relation, collection }: { relation: Relation; collection: string }) {
	const o2m = relation.related_collection === collection;
	const has_junction = (o2m || relation.field === 'item') && relation.meta?.junction_field !== null;
	const is_m2a = relation.meta?.junction_field === 'item' && (has_junction || !relation.related_collection);
	const is_m2a_junction = relation.field === 'item' && !relation.related_collection && relation.collection === collection;

	function RelationType(): 'm2a' | 'a2m' | 'm2m' | 'm2o' | 'o2m' {
		if (is_m2a || is_m2a_junction) return 'm2a';
		if (has_junction) return 'm2m';
		if (o2m) return 'o2m';
		return 'm2o';
	}

	function calculateField() {
		if (has_junction && o2m && !is_m2a) return relation.field;
		if (o2m) return relation.meta?.one_field ?? relation.field;
		return relation.meta?.many_field ?? relation.field;
	}

	function relatedCollection() {
		if (o2m) return relation.collection;
		if (relation.related_collection) return relation.related_collection;
		return relation.collection;
	}

	return { o2m, has_junction, is_m2a, is_m2a_junction, relationType: RelationType(), field: calculateField(), relatedCollection: relatedCollection() };
}
