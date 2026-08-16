// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Highlights from './highlights.vue';

describe('Highlights', () => {
	it('merges overlapping matches that begin at the first character', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: ['art', 'article'],
				text: 'Article archive',
			},
		});

		expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['Article']);
		expect(wrapper.text()).toContain('archive');
	});
});
