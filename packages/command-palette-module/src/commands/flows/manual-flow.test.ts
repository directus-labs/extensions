import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { getManualFlowTriggerPayload } from './manual-flow';

describe('getManualFlowTriggerPayload', () => {
	it('does not invent selection keys for collection flows', () => {
		expect(getManualFlowTriggerPayload({
			collection: 'articles',
			location: 'collection',
			values: { approved: true },
		})).toEqual({ collection: 'articles', approved: true });
	});

	it.each(['article-1', 0])('preserves the route primary key %s for item flows', (primaryKey) => {
		expect(getManualFlowTriggerPayload({
			collection: 'articles',
			location: 'item',
			primaryKey: ref(primaryKey),
			values: null,
		})).toEqual({ collection: 'articles', keys: [primaryKey] });
	});
});
