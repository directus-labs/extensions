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

	it('maps matches back to the original text when normalization expands characters', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'strasse',
				text: 'Æble straße',
			},
		});

		expect(wrapper.findAll('mark').map((mark) => mark.text())).toEqual(['straße']);
		expect(wrapper.text()).toContain('Æble');
	});

	it('shows a few words of context around each match', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'match',
				text: 'one two three four match five six seven eight',
			},
		});

		expect(wrapper.text()).toBe('... three four match five six ...');
	});

	it('keeps the spaces around a match and only adds an ellipsis for cut text', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'release',
				text: 'Writes the release notes',
			},
		});

		expect(wrapper.find('mark').text()).toBe('release');
		expect(wrapper.text()).toBe('Writes the release notes');
	});

	it('keeps a space typed after the query', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'release ',
				text: 'Writes the release notes',
			},
		});

		expect(wrapper.text()).toBe('Writes the release notes');
	});

	it('does not add a space inside a word', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'release',
				text: 'A prerelease build',
			},
		});

		expect(wrapper.text()).toBe('A prerelease build');
	});

	it.each([
		['before', `😀${'x'.repeat(199)}match`, `... ${'x'.repeat(199)}match`],
		['after', `match${'x'.repeat(199)}😀 end`, `match${'x'.repeat(199)} ...`],
	])('does not split an emoji at the context cutoff %s a match', (_, text, expected) => {
		const wrapper = mount(Highlights, { props: { query: 'match', text } });

		expect(wrapper.text()).toBe(expected);
	});

	it('renders a bounded number of snippets for texts with thousands of matches', () => {
		const wrapper = mount(Highlights, {
			props: {
				query: 'ip',
				text: 'lorem ipsum '.repeat(3500),
			},
		});

		expect(wrapper.findAll('mark')).toHaveLength(10);
		expect(wrapper.text().endsWith('...')).toBe(true);
	});
});
