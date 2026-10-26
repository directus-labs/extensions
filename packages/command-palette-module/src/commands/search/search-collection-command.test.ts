// @vitest-environment happy-dom

import type { Ref } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import SearchCollectionCommand from './search-collection-command.vue';

const mocks = vi.hoisted(() => ({
	addRecentItem: vi.fn(),
	apiGet: vi.fn().mockResolvedValue({ data: { data: [{ id: 1, title: 'Existing article' }] } }),
	close: vi.fn(),
	collections: [] as Record<string, unknown>[],
	push: vi.fn(),
	readableFields: ['id', 'title'],
	recentItems: [{ collection: 'articles', pk: '1' }] as Record<string, unknown>[],
	route: { path: '/content/articles', params: { collection: 'articles' }, query: {} as Record<string, string> },
	search: undefined as Ref<string> | undefined,
}));

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => ({ get: mocks.apiGet }),
	useStores: () => ({
		useCollectionsStore: () => ({
			getCollection: () => ({ name: 'Articles', meta: { display_template: '{{title}}', icon: 'article' } }),
		}),
		useFieldsStore: () => ({
			getField: (_collection: string, field: string) => mocks.readableFields.includes(field) || null,
			getPrimaryKeyFieldForCollection: () => ({ field: 'id' }),
		}),
		useUserStore: () => ({ currentUser: { id: 'user-1' } }),
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('vue-router', () => ({
	useRoute: () => mocks.route,
	useRouter: () => ({ currentRoute: ref({}), push: mocks.push }),
}));

vi.mock('../../command-palette', async () => {
	const { ref } = await vi.importActual<typeof import('vue')>('vue');
	mocks.search = ref('');
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
		useCommandContext: () => ({ search: mocks.search, loading: ref(false), close: mocks.close }),
	};
});

vi.mock('../../command-palette/composables/use-recent-items', () => ({
	useRecentItems: () => ({ items: ref(mocks.recentItems), add: mocks.addRecentItem }),
}));

vi.mock('../../composables/use-settings', () => ({
	useSettings: () => ({
		collections: ref(mocks.collections),
		settings: ref({ triggerRate: 0 }),
	}),
}));

vi.mock('../../composables/use-unexpected-error', () => ({
	useUnexpectedError: () => vi.fn(),
}));

vi.mock('../../utils/is-item-route-available', () => ({
	isItemRouteAvailable: () => true,
}));

enableAutoUnmount(afterEach);

function mountCommand() {
	return mount(SearchCollectionCommand, {
		props: { collection: 'articles' },
		global: {
			stubs: {
				'render-template': {
					props: ['item', 'template'],
					template: '<span :data-template="template">{{ item.title }}</span>',
				},
				'v-icon': true,
			},
		},
	});
}

async function searchFor(query: string) {
	mocks.search!.value = query;

	await vi.waitFor(() => expect(mocks.apiGet).toHaveBeenCalledWith('/items/articles', expect.objectContaining({
		params: expect.not.objectContaining({ filter: { id: { _eq: '1' } } }),
	})));

	return mocks.apiGet.mock.calls.at(-1)![1].params;
}

beforeEach(() => {
	mocks.apiGet.mockClear();
	mocks.addRecentItem.mockClear();
	mocks.push.mockClear();
	mocks.close.mockClear();
	mocks.collections.splice(0, mocks.collections.length, { collection: 'articles', fields: ['title'] });
	mocks.readableFields = ['id', 'title'];
	mocks.recentItems = [{ collection: 'articles', pk: '1' }];
	mocks.route.query = {};
	if (mocks.search) mocks.search.value = '';
});

describe('SearchCollectionCommand', () => {
	it('shows recent items and reopens the selected item', async () => {
		const wrapper = mountCommand();

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

	it('honors the configured search fields, filter, sort, and limit', async () => {
		mocks.collections.splice(0, 1, {
			collection: 'articles',
			fields: ['author.name'],
			filter: { status: { _neq: 'draft' } },
			sort: '-date',
			limit: 10,
		});

		mocks.readableFields = ['id', 'title', 'author.name'];
		mocks.recentItems = [];
		mountCommand();

		const params = await searchFor('ada');

		expect(params).not.toHaveProperty('search');

		expect(params).toMatchObject({
			filter: { _and: [{ status: { _neq: 'draft' } }, { _or: [{ author: { name: { _icontains: 'ada' } } }] }] },
			sort: '-date',
			limit: 10,
		});
	});

	it('uses full-text search for collections without a search config', async () => {
		mocks.collections.splice(0, 1);
		mocks.recentItems = [];
		mountCommand();

		expect(await searchFor('ada')).toMatchObject({ search: 'ada', limit: 25 });
	});

	it('drops template fields the user cannot read', async () => {
		mocks.readableFields = ['id'];
		mocks.recentItems = [];
		const wrapper = mountCommand();
		mocks.apiGet.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });

		const params = await searchFor('ada');

		expect(params.fields).toEqual(['id', 'id']);
		await vi.waitFor(() => expect(wrapper.find('[data-template="{{id}}"]').exists()).toBe(true));
	});

	it('only tags results with a version when the host returns version metadata', async () => {
		mocks.route.query = { version: 'draft' };
		mocks.recentItems = [];
		const wrapper = mountCommand();
		mocks.apiGet.mockResolvedValueOnce({ data: { data: [{ id: 2, title: 'Main only' }] } });

		await searchFor('main');
		await vi.waitFor(() => expect(wrapper.text()).toContain('Main only'));
		await wrapper.get('.item').trigger('click');

		expect(mocks.push).toHaveBeenCalledWith({ path: '/content/articles/2' });
	});
});
