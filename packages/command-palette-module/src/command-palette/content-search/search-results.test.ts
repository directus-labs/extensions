// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { Command, CommandInput } from '../../primitives/cmdk';
import SearchResults from './search-results.vue';

vi.mock('@directus/extensions-sdk', () => ({
	useStores: () => ({
		useCollectionsStore: () => ({
			getCollection: () => ({ name: 'Articles', meta: { icon: 'article' } }),
		}),
	}),
}));

describe('SearchResults', () => {
	it('keeps server results visible during filtering and emits the selected item', async () => {
		const select = vi.fn();
		const wrapper = mount(
			defineComponent(() => () =>
				h(Command, { filter: () => 0, forceSort: true }, () => [
					h(CommandInput),
					h(SearchResults, {
						query: 'article',
						results: [{
							collection: 'articles',
							primaryKeyField: 'id',
							hits: [{ id: 'article"]', title: 'Article' }],
							displayTemplate: '{{title}}',
						}],
						onSelect: select,
					}),
				]),
			),
			{
				global: {
					stubs: {
						'render-template': true,
						'v-icon': true,
					},
				},
			},
		);

		await wrapper.get('input').setValue('no-match');
		expect(wrapper.find('[cmdk-group]').exists()).toBe(true);

		await wrapper.get('[cmdk-item]').trigger('click');

		expect(select).toHaveBeenCalledWith({
			collection: 'articles',
			pk: 'article"]',
		});
	});
});
