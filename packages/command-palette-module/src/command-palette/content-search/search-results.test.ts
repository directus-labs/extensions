// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { ListboxContent, ListboxRoot } from 'reka-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import SearchResults from './search-results.vue';

vi.mock('@directus/extensions-sdk', () => ({
	useStores: () => ({
		useCollectionsStore: () => ({
			getCollection: () => ({ name: 'Articles', meta: { icon: 'article' } }),
		}),
	}),
}));

describe('SearchResults', () => {
	it('renders server results in a group and emits the selected item', async () => {
		const select = vi.fn();
		const wrapper = mount(
			defineComponent(() => () =>
				h(ListboxRoot, { modelValue: '' }, () => h(ListboxContent, () =>
					h(SearchResults, {
						query: 'article',
						results: [{
							collection: 'articles',
							primaryKeyField: 'id',
							hits: [{ id: 'article"]', title: 'Article' }],
							displayTemplate: '{{title}}',
						}],
						onSelect: select,
					}))),
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

		expect(wrapper.get('[role="group"]').text()).toContain('Articles');

		await wrapper.get('[role="option"]').trigger('click');

		expect(select).toHaveBeenCalledWith({
			collection: 'articles',
			pk: 'article"]',
		});
	});
});
