// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import CollectionResults from './collection-results.vue';

vi.mock('@directus/extensions-sdk', () => ({
	useCollection: () => ({
		info: ref({ name: 'Articles', meta: { icon: 'article' } }),
		primaryKeyField: ref({ field: 'id' }),
	}),
}));

vi.mock('vue-router', () => ({
	useRouter: () => ({ resolve: () => ({ matched: [{}] }) }),
}));

describe('CollectionResults', () => {
	it('renders all hits a page at a time', async () => {
		const wrapper = mount(CollectionResults, {
			props: {
				collection: 'articles',
				query: 'article',
				displayTemplate: '{{title}}',
				hits: Array.from({ length: 60 }, (_, index) => ({ id: index + 1, title: `Article ${index + 1}` })),
			},
			global: {
				stubs: {
					'v-detail': { template: '<div><slot /></div>' },
					'v-list-item': { template: '<div class="hit"><slot /></div>' },
					'v-button': { emits: ['click'], template: '<button class="show-more" @click="$emit(\'click\')"><slot /></button>' },
					'v-icon': true,
					'render-template': true,
				},
			},
		});

		expect(wrapper.findAll('.hit')).toHaveLength(25);
		expect(wrapper.get('.show-more').text()).toBe('Show more (35)');

		await wrapper.get('.show-more').trigger('click');
		await wrapper.get('.show-more').trigger('click');

		expect(wrapper.findAll('.hit')).toHaveLength(60);
		expect(wrapper.find('.show-more').exists()).toBe(false);
	});
});
