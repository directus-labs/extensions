// @vitest-environment happy-dom

import type { MaybeRefOrGetter, Ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { ListboxRoot } from 'reka-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, toValue } from 'vue';
import { provideGlobalCommandContext } from './composables/use-global-command-state';
import RootCommands from './root-commands.vue';
import { createCommandRouter, provideCommandRouter } from './router/router';

const loading = ref(false);
const showAskAi = ref(false);
const askAi = vi.fn();
const registered = vi.hoisted(() => ({ context: undefined as unknown, name: 'Flows' }));

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => ({}),
	useStores: () => ({
		useUserStore: () => ({ currentUser: { id: 'user-1' } }),
		useCollectionsStore: () => ({ getCollection: () => null }),
	}),
}));

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock('vue-router', () => ({ useRouter: () => ({ currentRoute: ref({}), push: vi.fn() }) }));
vi.mock('../composables/use-settings', () => ({ useSettings: () => ({ settings: ref({}) }) }));
vi.mock('../composables/use-unexpected-error', () => ({ useUnexpectedError: () => vi.fn() }));
vi.mock('../composables/use-global-search', () => ({ useGlobalSearch: () => ({ results: ref([]), loading }) }));

vi.mock('./composables/use-ask-ai', () => ({ useAskAi: () => ({ visible: showAskAi, askAi }) }));

vi.mock('./registry', () => ({
	useRegisteredCommands: (context: unknown) => {
		registered.context = context;
		return { groups: ref([]), commands: ref([{ id: 'flows', name: registered.name }]) };
	},
}));

function mountRoot(search: string | Ref<string>) {
	return mount(defineComponent(() => {
		const router = createCommandRouter({ root: RootCommands });
		provideCommandRouter(router);

		provideGlobalCommandContext({
			search: typeof search === 'string' ? ref(search) : search,
			loading: ref(false),
			router,
			close: vi.fn(),
			clearSearch: vi.fn(),
		});

		return () => h(ListboxRoot, { modelValue: '' }, () => h(RootCommands));
	}), {
		global: {
			stubs: { 'v-icon': true, 'v-progress-circular': true },
		},
	});
}

describe('RootCommands', () => {
	it('holds the empty state while content search is pending', async () => {
		loading.value = true;
		const wrapper = mountRoot('zzqq');
		await flushPromises();
		expect(wrapper.text()).not.toContain('No results found');

		loading.value = false;
		await flushPromises();
		expect(wrapper.text()).toContain('No results found');
	});

	it('offers Ask AI last, in its own group, instead of the empty state', async () => {
		showAskAi.value = true;
		const wrapper = mountRoot('flows');
		await flushPromises();

		const options = wrapper.findAll('[role="option"]');
		expect(options).toHaveLength(2);
		expect(options.at(-1)!.text()).toBe('Ask AI: flows');
		expect(options.at(-1)!.element.closest('[role="group"]')!.textContent).toContain('AI Assistant');

		await options.at(-1)!.trigger('click');
		expect(askAi).toHaveBeenCalledOnce();

		const noMatch = mountRoot('zzqq');
		await flushPromises();
		expect(noMatch.text()).not.toContain('No results found');
		expect(noMatch.text()).toContain('Ask AI: zzqq');
		showAskAi.value = false;
	});

	it('does not rebuild registered commands on each keystroke', async () => {
		const search = ref('fl');
		mountRoot(search);
		const context = toValue(registered.context as MaybeRefOrGetter<object>);

		search.value = 'flo';
		await flushPromises();

		expect(toValue(registered.context as MaybeRefOrGetter<object>)).toBe(context);
	});

	it('shows command names as plain text', async () => {
		registered.name = 'Run *Publish*';
		const wrapper = mountRoot('');
		await flushPromises();

		expect(wrapper.get('[role="option"]').text()).toBe('Run *Publish*');
		registered.name = 'Flows';
	});
});
