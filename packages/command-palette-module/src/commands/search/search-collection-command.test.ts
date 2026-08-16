// @vitest-environment happy-dom

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import SearchCollectionCommand from './search-collection-command.vue';

const mocks = vi.hoisted(() => ({
	addRecentItem: vi.fn(),
	apiGet: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, title: 'Existing article' }] } }),
	close: vi.fn(),
	push: vi.fn(),
	recentItems: [{ collection: 'articles', pk: '1' }],
}));

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => ({ get: mocks.apiGet }),
	useStores: () => ({
		useCollectionsStore: () => ({
			getCollection: () => ({ name: 'Articles', meta: { display_template: '{{title}}', icon: 'article' } }),
		}),
		useFieldsStore: () => ({
			getPrimaryKeyFieldForCollection: () => ({ field: 'id' }),
		}),
		useUserStore: () => ({ currentUser: { id: 'user-1' } }),
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('vue-router', () => ({
	useRoute: () => ({
		path: '/content/articles',
		params: { collection: 'articles' },
		query: {},
	}),
	useRouter: () => ({ currentRoute: ref({}), push: mocks.push }),
}));

vi.mock('../../command-palette', () => {
	const Empty = defineComponent({ template: '<div><slot /></div>' });
	const Group = defineComponent({ template: '<section><slot /></section>' });
	const Item = defineComponent({
		emits: ['select'],
		template: '<button class="item" @click="$emit(\'select\')"><slot /></button>',
	});
	const List = defineComponent({ template: '<div><slot /></div>' });

	return {
		Empty,
		Group,
		Item,
		List,
		useCommandContext: () => ({ search: ref(''), loading: ref(false), close: mocks.close }),
	};
});

vi.mock('../../command-palette/composables/use-recent-items', () => ({
	useRecentItems: () => ({ items: ref(mocks.recentItems), add: mocks.addRecentItem }),
}));

vi.mock('../../composables/use-settings', () => ({
	useSettings: () => ({
		collections: ref([{ collection: 'articles', fields: ['title'] }]),
		settings: ref({ triggerRate: 0 }),
	}),
}));

vi.mock('../../composables/use-unexpected-error', () => ({
	useUnexpectedError: () => vi.fn(),
}));

vi.mock('../../utils/is-item-route-available', () => ({
	isItemRouteAvailable: () => true,
}));

describe('SearchCollectionCommand', () => {
	it('shows recent items and reopens the selected item', async () => {
		const wrapper = mount(SearchCollectionCommand, {
			props: { collection: 'articles' },
			global: {
				stubs: {
					'render-template': {
						props: ['item'],
						template: '<span>{{ item.title }}</span>',
					},
					'v-icon': true,
				},
			},
		});

		await vi.waitFor(() => expect(wrapper.text()).toContain('Existing article'));

		expect(mocks.apiGet).toHaveBeenCalledWith('/items/articles', expect.objectContaining({
			params: expect.objectContaining({ filter: { id: { _eq: '1' } } }),
		}));

		await wrapper.get('.item').trigger('click');

		expect(mocks.addRecentItem).toHaveBeenCalledWith({
			collection: 'articles',
			pk: '1',
		});

		expect(mocks.push).toHaveBeenCalledOnce();
		expect(mocks.close).toHaveBeenCalledOnce();
	});
});
