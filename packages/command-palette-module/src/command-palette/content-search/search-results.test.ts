// @vitest-environment happy-dom

import type { DescriptionDisplay } from '../../types';
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

function mountResults(descriptionDisplay?: DescriptionDisplay) {
	return mount(
		defineComponent(() => () =>
			h(ListboxRoot, { modelValue: '' }, () => h(ListboxContent, () =>
				h(SearchResults, {
					query: 'draft',
					results: [{
						collection: 'articles',
						primaryKeyField: 'id',
						hits: [{ id: 1, title: 'Article', status: 'draft' }],
						displayTemplate: '{{title}}',
						descriptionField: 'status',
						...(descriptionDisplay ? { descriptionDisplay } : {}),
					}],
				}))),
		),
		{
			global: {
				stubs: {
					'render-template': { props: ['template'], template: '<span class="template" :data-template="template" />' },
					'v-icon': true,
				},
				components: {
					'display-labels': {
						props: ['value', 'field'],
						template: '<span class="display-labels" :data-field="field">{{ value }}</span>',
					},
				},
			},
		},
	);
}

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

	it('renders the description through its display when it has one', () => {
		const wrapper = mountResults({ component: 'display-labels', props: { field: 'status' } });

		expect(wrapper.get('.display-labels').text()).toBe('draft');
		expect(wrapper.get('.display-labels').attributes('data-field')).toBe('status');
		expect(wrapper.find('mark').exists()).toBe(false);
	});

	it('renders the description as highlighted text otherwise', () => {
		const wrapper = mountResults();

		expect(wrapper.find('.display-labels').exists()).toBe(false);
		expect(wrapper.get('mark').text()).toBe('draft');
	});
});
