// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, onErrorCaptured, ref, resolveDynamicComponent } from 'vue';
import DescriptionBoundary from './description-boundary.vue';

const broken = ref(true);

const DisplayStub = defineComponent({
	props: { value: { type: String, required: true } },
	setup(props) {
		return () => {
			if (broken.value && props.value.startsWith('bad')) throw new Error(`cannot display ${props.value}`);
			return h('span', { class: 'display' }, props.value);
		};
	},
});

function mountList(initial: string[]) {
	const values = ref(initial);

	const wrapper = mount(
		defineComponent(() => () =>
			h(DescriptionBoundary, { results: values.value }, {
				default: ({ failed }: { failed: Set<string> }) => values.value.map((value) =>
					h('div', { key: value, class: 'row' }, [
						failed.has(value)
							? h('span', { class: 'plain' }, value)
							: h(resolveDynamicComponent('display-stub') as any, { 'value': value, 'data-description-key': value }),
					]),
				),
			}),
		),
		{ global: { components: { 'display-stub': DisplayStub } } },
	);

	return Object.assign(wrapper, { values });
}

afterEach(() => {
	broken.value = true;
	vi.restoreAllMocks();
});

describe('DescriptionBoundary', () => {
	it('drops only the rows whose display throws back to plain text and logs once', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const wrapper = mountList(['draft', 'bad-1', 'published', 'bad-2']);
		await nextTick();

		expect(wrapper.findAll('.row').map((row) => row.text())).toEqual(['draft', 'bad-1', 'published', 'bad-2']);
		expect(wrapper.findAll('.display').map((display) => display.text())).toEqual(['draft', 'published']);
		expect(wrapper.findAll('.plain').map((plain) => plain.text())).toEqual(['bad-1', 'bad-2']);
		expect(warn).toHaveBeenCalledOnce();
	});

	it('gives new results a fresh chance to render their display', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const wrapper = mountList(['bad-1', 'draft']);
		await nextTick();
		expect(wrapper.findAll('.plain').map((plain) => plain.text())).toEqual(['bad-1']);

		broken.value = false;
		wrapper.values.value = ['bad-1', 'draft'];
		await nextTick();
		await nextTick();

		expect(wrapper.findAll('.plain')).toHaveLength(0);
		expect(wrapper.findAll('.display').map((display) => display.text())).toEqual(['bad-1', 'draft']);
	});

	it('lets errors from other components through', () => {
		const Broken = defineComponent(() => () => {
			throw new Error('not a description');
		});
		const captured = vi.fn((_error: unknown) => false);

		mount(defineComponent(() => {
			onErrorCaptured(captured);
			return () => h(DescriptionBoundary, { results: [] }, { default: () => h(Broken) });
		}));

		expect(captured).toHaveBeenCalledOnce();
		expect(captured.mock.calls[0]?.[0]).toMatchObject({ message: 'not a description' });
	});
});
