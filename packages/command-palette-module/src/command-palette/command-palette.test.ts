// @vitest-environment happy-dom

import type { Ref } from 'vue';
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, nextTick, ref } from 'vue';
import CommandPalette from './command-palette.vue';
import Group from './components/group.vue';
import Item from './components/item.vue';
import List from './components/list.vue';
import { useCommandContext } from './composables/use-global-command-state';
import { useCommandRouter } from './router/router';
import { rankItems } from './utils/rank-items';

const selected = vi.fn();
// Stands in for commands whose availability resolves after the query was typed.
const late = ref<string[]>([]);
let paletteLoading: Ref<boolean> | undefined;

const SubView = defineComponent(() => () => h(List, () => h(Item, { value: 'sub' }, () => 'Sub item')));

vi.mock('./root-commands.vue', () => ({
	default: defineComponent(() => {
		const { search, loading } = useCommandContext();
		paletteLoading = loading;
		const router = useCommandRouter();
		const names = ['Alpha', 'Beta', 'Gamma'];
		const filtered = computed(() => rankItems(names, search.value, (value) => ({ value })).map(({ item }) => item));

		const item = (name: string) => h(Item, { key: name, value: name, onSelect: () => selected(name) }, () => name);
		const inGroup = (names: string[]) => filtered.value.filter((name) => names.includes(name));

		return () => h(List, () => [
			...late.value.map(item),
			inGroup(['Alpha', 'Beta']).length > 0 ? h(Group, { key: 'first', heading: 'First' }, () => inGroup(['Alpha', 'Beta']).map(item)) : null,
			inGroup(['Gamma']).length > 0 ? h(Group, { key: 'second', heading: 'Second' }, () => inGroup(['Gamma']).map(item)) : null,
			h(Item, { key: 'open', value: 'open', onSelect: () => router.push({ component: SubView }) }, () => 'Open sub-view'),
		]);
	}),
}));

async function settle() {
	await flushPromises();
	await new Promise((resolve) => setTimeout(resolve, 5));
	await nextTick();
	await nextTick();
}

function mountPalette() {
	return mount(CommandPalette, {
		props: { active: true },
		attachTo: document.body,
		global: { stubs: { 'v-icon': true, 'v-progress-circular': true } },
	});
}

function highlighted(wrapper: ReturnType<typeof mountPalette>) {
	return wrapper.find('[data-highlighted]').text();
}

async function press(wrapper: ReturnType<typeof mountPalette>, key: string, init: KeyboardEventInit = {}) {
	await wrapper.get('input').trigger('keydown', { key, ...init });
	await settle();
}

enableAutoUnmount(afterEach);

afterEach(() => {
	vi.restoreAllMocks();
	selected.mockReset();
	late.value = [];
	document.body.innerHTML = '';
});

describe('CommandPalette', () => {
	it('highlights the first item and wraps around at both ends', async () => {
		const wrapper = mountPalette();
		await settle();
		expect(highlighted(wrapper)).toBe('Alpha');

		await press(wrapper, 'ArrowUp');
		expect(highlighted(wrapper)).toBe('Open sub-view');

		await press(wrapper, 'ArrowDown');
		expect(highlighted(wrapper)).toBe('Alpha');

		await press(wrapper, 'ArrowDown');
		expect(highlighted(wrapper)).toBe('Beta');
	});

	it('selects the highlighted item on Enter', async () => {
		const wrapper = mountPalette();
		await settle();
		await press(wrapper, 'ArrowDown');
		await press(wrapper, 'Enter');

		expect(selected).toHaveBeenCalledWith('Beta');
	});

	it('ignores the Enter that ends an IME composition', async () => {
		const wrapper = mountPalette();
		await settle();
		await press(wrapper, 'Enter', { isComposing: true });
		await press(wrapper, 'Enter', { keyCode: 229 });

		expect(selected).not.toHaveBeenCalled();
	});

	it('jumps between groups on Alt+Arrow', async () => {
		const wrapper = mountPalette();
		await settle();

		await press(wrapper, 'ArrowDown', { altKey: true });
		expect(highlighted(wrapper)).toBe('Gamma');

		await press(wrapper, 'ArrowUp', { altKey: true });
		expect(highlighted(wrapper)).toBe('Alpha');
	});

	it('filters by score and highlights the best match after typing', async () => {
		const wrapper = mountPalette();
		await settle();
		await press(wrapper, 'ArrowDown');
		await wrapper.get('input').setValue('gam');
		await settle();

		expect(wrapper.findAll('[role="option"]').map((option) => option.text())).toEqual(['Gamma', 'Open sub-view']);
		expect(highlighted(wrapper)).toBe('Gamma');
	});

	it('goes back from a sub-view on Backspace in an empty input', async () => {
		const wrapper = mountPalette();
		await settle();
		await press(wrapper, 'ArrowUp');
		await press(wrapper, 'Enter');
		expect(highlighted(wrapper)).toBe('Sub item');

		await press(wrapper, 'Backspace');
		expect(highlighted(wrapper)).toBe('Alpha');
	});

	it('moves an automatic highlight to results that arrive above it', async () => {
		const wrapper = mountPalette();
		await settle();
		await wrapper.get('input').setValue('zz');
		await settle();
		expect(highlighted(wrapper)).toBe('Open sub-view');

		late.value = ['Late match'];
		await settle();
		expect(highlighted(wrapper)).toBe('Late match');
	});

	it('keeps a highlight the user chose when results arrive', async () => {
		const wrapper = mountPalette();
		await settle();
		await wrapper.get('input').setValue('zz');
		await settle();
		await press(wrapper, 'ArrowDown');

		late.value = ['Late match'];
		await settle();
		expect(highlighted(wrapper)).toBe('Open sub-view');
	});

	it('keeps a highlight picked by hovering when results arrive', async () => {
		const wrapper = mountPalette();
		await settle();
		await wrapper.get('input').setValue('zz');
		await settle();
		await wrapper.get('[role="option"]').trigger('pointermove');

		late.value = ['Late match'];
		await settle();
		expect(highlighted(wrapper)).toBe('Open sub-view');
	});

	it.each(['arrow', 'hover'])('keeps a highlight picked by %s while results load', async (how) => {
		const wrapper = mountPalette();
		await settle();
		paletteLoading!.value = true;
		await settle();

		await (how === 'arrow' ? press(wrapper, 'ArrowDown') : wrapper.findAll('[role="option"]').find((option) => option.text() === 'Beta')!.trigger('pointermove'));
		await settle();
		expect(highlighted(wrapper)).toBe('Beta');

		late.value = ['Late match'];
		paletteLoading!.value = false;
		await settle();
		expect(highlighted(wrapper)).toBe('Beta');
	});

	it('does the same highlight work on open however many items there are', async () => {
		const scroll = vi.spyOn(Element.prototype, 'scrollIntoView');
		const querySelectorAll = vi.spyOn(Element.prototype, 'querySelectorAll');
		const collectionReads = () => querySelectorAll.mock.calls.filter(([selector]) => selector.includes('data-reka-collection-item')).length;

		const work: number[][] = [];

		for (const count of [5, 200]) {
			late.value = Array.from({ length: count }, (_, index) => `Late ${index}`);
			scroll.mockClear();
			querySelectorAll.mockClear();

			const wrapper = mountPalette();
			await settle();
			expect(highlighted(wrapper)).toBe('Late 0');
			work.push([scroll.mock.calls.length, collectionReads()]);
			wrapper.unmount();
		}

		// Only Reka's own highlight on mount: one scroll and two collection reads. Ours reads the DOM once instead.
		expect(work).toEqual([[1, 2], [1, 2]]);
	});
});
