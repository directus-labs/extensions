// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import RecentSearches from './recent-searches.vue';

vi.mock('vue-i18n', () => ({
	useI18n: () => ({
		t: (key: string) => ({
			'date-fns_time_no_seconds': 'HH:mm',
			'date-fns_date_short_no_year': 'MMM d',
			'date-fns_date_short': 'MMM d, yyyy',
			'today': 'Today',
			'yesterday': 'Yesterday',
		})[key] ?? key,
	}),
}));

const passthrough = { template: '<div><slot /></div>' };

describe('RecentSearches', () => {
	it('lets the user rerun and clear stored searches', async () => {
		const wrapper = mount(RecentSearches, {
			props: {
				searches: [{ query: 'articles', timestamp: new Date().toISOString() }],
			},
			global: {
				stubs: {
					'v-button': {
						emits: ['click'],
						template: '<button class="clear-history" @click="$emit(\'click\')"><slot /></button>',
					},
					'v-divider': passthrough,
					'v-icon': true,
					'v-list': passthrough,
					'v-list-item': {
						emits: ['click'],
						template: '<button class="recent-search" @click="$emit(\'click\')"><slot /></button>',
					},
					'v-list-item-content': passthrough,
				},
			},
		});

		await wrapper.get('.recent-search').trigger('click');
		await wrapper.get('.clear-history').trigger('click');

		expect(wrapper.emitted('select')).toEqual([['articles']]);
		expect(wrapper.emitted('clear')).toHaveLength(1);
	});
});
