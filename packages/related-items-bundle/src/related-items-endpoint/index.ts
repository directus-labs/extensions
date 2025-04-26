import type { Accountability, Collection, Field, Query, Relation } from '@directus/types';
import type { RelatedItem } from '../types';
import { defineEndpoint } from '@directus/extensions-sdk';
import { getFieldsFromTemplate } from '@directus/utils';
import { displayTemplate } from './utils/display-template';

interface CollectionDetail {
	property: Collection;
	display_template: string | null | undefined;
	template_fields: string[];
	field_name: string;
	many_field?: string | null;
	item_id: number | string | number[] | string[];
	fields: Field[];
	primaryKey: string;
}

export default defineEndpoint({
	id: 'related-items',
	handler: (router, { services, getSchema }) => {
		const {
			FieldsService,
			CollectionsService,
			ItemsService,
			RelationsService,

		} = services;

		router.get('/:collection/:id', async (req, res) => {
			const collection: string = req.params.collection;
			const primaryId: number | string = req.params.id;
			const query = req.query;

			const accountability: Accountability | null = 'accountability' in req ? req.accountability as Accountability : null;
			const schema = await getSchema();

			// Services
			const collectionService = new CollectionsService({
				accountability,
				schema,
			});

			const relationService = new RelationsService({
				accountability,
				schema,
			});

			const fieldService = new FieldsService({
				accountability,
				schema,
			});

			async function fetchItem({ collection, id, query }: { collection: string | null; id?: number | string; query?: Query }) {
				if (!collection || (!id && !query)) return;

				const itemService = new ItemsService(collection, {
					accountability,
					schema,
				});
				return id ? await itemService.readOne(id) : await itemService.readByQuery(query);
			}

			// Fetch context
			const requested_item: Record<string, any> = await fetchItem({ collection, id: primaryId, query });

			// Fetch all relations
			const relations: Relation[] = await relationService.readAll();

			// Extract O2M relations for current collection
			const related_o2m_collections: Relation[] = relations.filter((r) => r.collection === collection);

			// Extract M2O relations for current collection
			const related_m2o_collections: Relation[] = relations.filter((r) => r.related_collection === collection || r.meta?.one_allowed_collections?.includes(collection));

			// Fetch collection metadata
			async function fetchCollectionInfo({ collection, field_name, item_id, relation }: { collection: string | null; field_name: string; item_id: number | string | number[] | string[]; relation: Relation }): Promise<CollectionDetail | null> {
				if (!collection) return null;
				const current_collection: Collection = await collectionService.readOne(collection);
				const display_template = displayTemplate(collection, current_collection.meta?.display_template);
				const template_fields = getFieldsFromTemplate(display_template).filter((t) => !t.includes('$'));
				const fields: Field[] = await fieldService.readAll(collection);
				const primaryKey: string = fields.find((f) => f.schema?.is_primary_key)?.field ?? 'id';
				return { property: current_collection, display_template, template_fields, field_name, many_field: relation.meta?.junction_field, item_id, fields, primaryKey };
			}

			// Iterate over "Any" collections and fetch metadata
			async function fetchM2aCollectionInfo({ collections, m2m_relation, relation }: { collections: string[]; m2m_relation: Relation; relation: Relation }) {
				if (collections.length === 0 || m2m_relation === null) return [];
				const promises = collections.map(async (collection) => {
					if (m2m_relation.meta?.many_field && m2m_relation.meta.junction_field && m2m_relation.meta?.one_collection_field) {
						// Field containing the ID of the linked item
						const many_field: string = m2m_relation.meta?.many_field;
						// Field containing the ID of the parent item
						const junction_field: string = m2m_relation.meta.junction_field;
						// Field containing the collection ID
						const one_collection_field: string = m2m_relation.meta?.one_collection_field;

						try {
							// Fetch IDs of related content
							const m2a_junction_items: Record<string, number | string>[] = await fetchItem({ collection: m2m_relation.collection, query: {
								fields: [
									many_field,
								],
								filter: {
									[junction_field]: {
										_eq: primaryId,
									},
									[one_collection_field]: {
										_eq: collection,
									},
								},
								limit: -1,
							} });

							// List of all item IDs belonging to the primary ID
							const item_ids = m2a_junction_items.map((i) => i[many_field]) as number[] | string[];
							return await fetchCollectionInfo({ collection, field_name: relation.meta?.one_field ?? relation.field, item_id: item_ids, relation });
						}
						catch (error) {
							console.warn(error);
							return null;
						}
					}
					else {
						return null;
					}
				});
				return Promise.all(promises);
			}

			async function build_output({ o2m, is_m2a, is_junction, relation_type, collection, related_collection, relation }: { o2m: boolean; is_m2a: boolean; is_junction: boolean; relation_type: string; collection: CollectionDetail; related_collection?: string; relation: Relation }) {
				// Build array of fields required for visual output
				const itemFields = [
					relation_type === 'm2m' ? `${collection.many_field}.${collection.primaryKey}` : collection.primaryKey,
					...collection.template_fields.map((f) => relation_type === 'm2m' ? `${collection.many_field}.${f}` : f),
					...(
						collection.property.collection === 'directus_files'
							? [relation_type === 'm2m' ? `${collection.many_field}.type` : 'type']
							: []
					),
					...(
						collection.property.collection === 'directus_comments'
							? ['date_created']
							: []
					),
					...(
						collection.property.collection === 'directus_panels'
							? ['dashboard.name']
							: []
					),
					...(
						collection.property.collection === 'directus_notifications'
							? ['timestamp']
							: []
					),
				];

				// Filters to fetch related content
				const itemFilters = o2m
					? (Array.isArray(collection.item_id)
							? {
									[collection.primaryKey]: {
										_in: collection.item_id,
									},
								}
							: {
									[collection.field_name]: {
										_eq: collection.item_id,
									},
								})
					: {
							[is_junction ? collection.field_name : collection.primaryKey]: {
								_eq: collection.item_id,
							},
						};

				// Top level collection info
				const collectionInfo = {
					collection: collection.property.collection,
					fields: itemFields,
					relation: relation_type,
					translations: collection.property.meta?.translations,
					field: collection.field_name,
					junction_field: is_junction ? relation.meta?.junction_field : null,
					primary_key: collection.primaryKey,
					template: collection.display_template ?? `{{ ${collection.primaryKey} }}`,
				} as RelatedItem;

				try {
					const relatedItems = await fetchItem({ collection: is_m2a || related_collection === undefined ? collection.property.collection : related_collection, query: {
						fields: itemFields,
						// @ts-expect-error saying _and is missing but it's not required
						filter: itemFilters,
						limit: -1,
					} });
					return {
						...collectionInfo,
						items: relatedItems,
					};
				}
				catch {
					return {
						...collectionInfo,
						items: [],
					};
				}
			}

			async function relatedCollections(relations: Relation[]) {
				const promises = relations.map(async (r) => {
					const o2m = r.related_collection === collection;
					const is_junction = r.meta?.junction_field !== null;
					const is_m2a = is_junction && r.meta?.junction_field === 'item';

					const RelationType = () => {
						if (is_m2a) return 'm2a';
						if (is_junction) return 'm2m';
						if (o2m) return 'o2m';
						return 'm2o';
					};

					const calculateField = () => {
						if (is_junction && o2m && !is_m2a) return r.field;
						if (o2m) return r.meta?.one_field ?? r.field;
						return r.meta?.many_field ?? r.field;
					};

					const field = calculateField();

					const relatedCollection = () => {
						if (o2m) return r.collection;
						if (r.related_collection) return r.related_collection;
						return r.collection;
					};

					const related_collection = await fetchCollectionInfo({
						collection: relatedCollection(),
						field_name: field, // M2O: Field in current table where the Many item ID lived
						// O2M: Field in Many table where the current item ID lived
						item_id: o2m ? primaryId : requested_item[field],
						// O2M: Current Item ID    M2O: ID of Item in Many table
						relation: r,
					});

					const m2m_relation = is_junction ? await relationService.readOne(related_collection?.property.collection, r.meta?.junction_field) : null;

					const m2m_related_collection = m2m_relation
						? await fetchCollectionInfo({
							collection: m2m_relation ? m2m_relation.related_collection : null,
							field_name: field,
							item_id: field === 'item' || is_junction ? primaryId : (r.meta?.many_field ? requested_item[r.meta.many_field] : requested_item[field]),
							relation: r,
						})
						: null;

					const m2a_related_collections = is_m2a
						? await fetchM2aCollectionInfo({
							collections: m2m_relation.meta?.one_allowed_collections,
							m2m_relation,
							relation: r,
						})
						: [];

					const collections: (CollectionDetail | null)[] = is_m2a
						? m2a_related_collections
						: (is_junction
								? [m2m_related_collection]
								: [related_collection]);

					async function processCollections(collections: (CollectionDetail | null)[], related_collection: string) {
						const output_promise = collections.filter((c) => c && c.item_id).map(async (c) => await build_output({
							o2m,
							is_m2a,
							is_junction,
							relation_type: RelationType(),
							collection: c as CollectionDetail,
							related_collection,
							relation: r,
						}));
						return Promise.all(output_promise);
					}

					return related_collection ? (await processCollections(collections, related_collection.property.collection)) as RelatedItem[] : [];
				});
				return Promise.all(promises);
			}

			const related_content: RelatedItem[] = [];

			const o2m_collection_items = await relatedCollections(related_o2m_collections);
			const m2o_collection_items = await relatedCollections(related_m2o_collections);

			o2m_collection_items.forEach((c) => {
				related_content.push(...c);
			});

			m2o_collection_items.forEach((c) => {
				related_content.push(...c);
			});

			res.json(related_content);
		});
	},
});
