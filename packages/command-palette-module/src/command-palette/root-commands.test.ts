// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils';
import { ListboxRoot } from 'reka-ui';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { provideGlobalCommandContext } from './composables/use-global-command-state';
import RootCommands from './root-commands.vue';
import { createCommandRouter, provideCommandRouter } from './router/router';

const loading = ref(false);

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

vi.mock('./registry', () => ({
	useRegisteredCommands: () => ({ groups: ref([]), commands: ref([{ id: 'flows', name: 'Flows' }]) }),
}));

function mountRoot(search: string) {
	return mount(defineComponent(() => {
		const router = createCommandRouter({ root: RootCommands });
		provideCommandRouter(router);

		provideGlobalCommandContext({
			search: ref(search),
			loading: ref(false),
			router,
			close: vi.fn(),
			clearSearch: vi.fn(),
		});

		return () => h(ListboxRoot, { modelValue: '' }, () => h(RootCommands));
	}), {
		global: {
			stubs: { 'v-icon': true, 'v-progress-circular': true },
			directives: { md: {} },
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
});
