// @vitest-environment happy-dom

import type { VueWrapper } from '@vue/test-utils';
import type { Ref } from 'vue';
import type { SearchCollectionType, SearchConfigType } from '../types';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import { useGlobalSearch } from './use-global-search';

const mocks = vi.hoisted(() => ({
	apiGet: vi.fn(),
	getCollection: vi.fn(),
	getField: vi.fn(),
	hasPermission: vi.fn(),
	notificationsAdd: vi.fn(),
	replace: vi.fn(),
	resolve: vi.fn(),
	useSettings: vi.fn(),
	route: { query: {} as Record<string, unknown> },
}));

vi.mock('@directus/extensions-sdk', () => ({
	useApi: () => ({ get: mocks.apiGet }),
	useStores: () => ({
		useCollectionsStore: () => ({ getCollection: mocks.getCollection }),
		useFieldsStore: () => ({ getField: mocks.getField, getPrimaryKeyFieldForCollection: () => ({ field: 'id' }) }),
		useNotificationsStore: () => ({ add: mocks.notificationsAdd }),
		usePermissionsStore: () => ({ hasPermission: mocks.hasPermission }),
	}),
}));

vi.mock('vue-i18n', () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock('vue-router', () => ({
	useRoute: () => mocks.route,
	useRouter: () => ({ replace: mocks.replace, resolve: mocks.resolve }),
}));

vi.mock('./use-settings', () => ({
	useSettings: mocks.useSettings,
}));

interface MountedSearch {
	state: ReturnType<typeof useGlobalSearch>;
	wrapper: VueWrapper;
}

function collection(name: string): SearchCollectionType {
	return { collection: name, fields: ['title'], limit: 5, availableGlobally: true };
}

function mountSearch(options: Parameters<typeof useGlobalSearch>[0] = {}): MountedSearch {
	let state: ReturnType<typeof useGlobalSearch> | undefined;
	const wrapper = mount(defineComponent({
		setup() {
			state = useGlobalSearch(options);
			return () => null;
		},
	}));

	if (!state) throw new Error('Search composable did not mount');
	return { state, wrapper };
}

beforeEach(() => {
	vi.useFakeTimers();
	mocks.apiGet.mockReset();
	mocks.getCollection.mockReset().mockReturnValue(null);
	mocks.getField.mockReset().mockReturnValue({});
	mocks.hasPermission.mockReset().mockReturnValue(true);
	mocks.notificationsAdd.mockReset();
	mocks.replace.mockReset().mockImplementation(async () => {});
	mocks.resolve.mockReset().mockReturnValue({ matched: [{}] });
	mocks.route.query = {};

	mocks.useSettings.mockReset().mockReturnValue({
		settings: ref<SearchConfigType>({
			searchMode: 'as_you_type',
			collections: [],
			triggerRate: 0,
			commandPaletteEnabled: true,
		}),
		collections: ref([collection('articles')]),
		valid: ref(true),
	});
});

afterEach(() => {
	vi.useRealTimers();
	vi.restoreAllMocks();
});

async function flushPromises() {
	for (let index = 0; index < 10; index++) await Promise.resolve();
}

describe('useGlobalSearch', () => {
	it('keeps total request concurrency bounded across replaced queries', async () => {
		const query: Ref<string | null> = ref(null);
		let active = 0;
		let peak = 0;
		const requests: { aborted: boolean; resolve: () => void }[] = [];

		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'as_you_type', collections: [], triggerRate: 0 }),
			collections: ref(Array.from({ length: 5 }, (_, index) => collection(`articles_${index}`))),
			valid: ref(true),
		});

		mocks.apiGet.mockImplementation((_url, { signal }: { signal: AbortSignal }) =>
			new Promise((resolve, reject) => {
				active++;
				peak = Math.max(peak, active);
				const request = {
					aborted: false,
					resolve: () => {
						if (request.aborted) return;
						active--;
						resolve({ data: { data: [] } });
					},
				};
				requests.push(request);

				signal.addEventListener('abort', () => {
					if (request.aborted) return;
					request.aborted = true;
					active--;
					reject(new DOMException('Aborted', 'AbortError'));
				}, { once: true });
			}),
		);

		const { state, wrapper } = mountSearch({ query, globallyAvailableOnly: true });
		query.value = 'first';
		await nextTick();
		await vi.runOnlyPendingTimersAsync();
		await flushPromises();
		expect(active).toBe(5);

		query.value = 'second';
		await nextTick();
		await vi.runOnlyPendingTimersAsync();
		await flushPromises();
		expect(active).toBe(5);
		expect(peak).toBe(5);

		for (const request of requests) request.resolve();
		await flushPromises();
		expect(state.loading.value).toBe(false);
		wrapper.unmount();
	});

	it('settles and clears an on-submit request invalidated by an edit', async () => {
		const query: Ref<string | null> = ref(null);

		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'on_submit', collections: [], triggerRate: 0 }),
			collections: ref([collection('articles')]),
			valid: ref(true),
		});

		mocks.apiGet.mockImplementation((_url, { signal }: { signal: AbortSignal }) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
			}),
		);

		const { state, wrapper } = mountSearch({ query });
		const submitted = state.search('first');
		await flushPromises();
		expect(state.loading.value).toBe(true);

		query.value = 'edited';
		await nextTick();
		await submitted;
		expect(state.loading.value).toBe(false);
		expect(state.results.value).toEqual([]);
		expect(state.info.query).toBe('');
		wrapper.unmount();
	});

	it('filters unreadable collections before applying the global collection cap', async () => {
		const configured = Array.from({ length: 21 }, (_, index) => collection(`articles_${index}`));

		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'as_you_type', collections: [], triggerRate: 0 }),
			collections: ref(configured),
			valid: ref(true),
		});

		mocks.hasPermission.mockImplementation((name: string) => name === 'articles_20');
		mocks.apiGet.mockResolvedValue({ data: { data: [] } });

		const { state, wrapper } = mountSearch({ globallyAvailableOnly: true });
		expect(state.collections.value.map(({ collection }) => collection)).toEqual(['articles_20']);

		await state.search('article');
		expect(mocks.apiGet).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('excludes configured collections whose item route is unavailable in the host', () => {
		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'on_submit', collections: [], triggerRate: 0 }),
			collections: ref([collection('articles'), collection('unavailable')]),
			valid: ref(true),
		});

		mocks.resolve.mockImplementation(({ path }: { path: string }) => ({
			matched: path.includes('unavailable') ? [] : [{}],
		}));

		const { state, wrapper } = mountSearch();
		expect(state.collections.value.map(({ collection }) => collection)).toEqual(['articles']);
		wrapper.unmount();
	});

	it('cancels a pending debounce before an explicit submit starts', async () => {
		const query: Ref<string | null> = ref(null);

		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'as_you_type', collections: [], triggerRate: 100 }),
			collections: ref([collection('articles')]),
			valid: ref(true),
		});

		mocks.apiGet.mockResolvedValue({ data: { data: [] } });

		const { state, wrapper } = mountSearch({ query });
		query.value = 'article';
		await nextTick();
		await state.search('article');
		await vi.runAllTimersAsync();

		expect(mocks.apiGet).toHaveBeenCalledTimes(1);
		expect(state.loading.value).toBe(false);
		wrapper.unmount();
	});

	it('does not search again when only surrounding whitespace changes', async () => {
		const query: Ref<string | null> = ref(null);
		mocks.apiGet.mockResolvedValue({ data: { data: [{ id: 1, title: 'Release' }] } });

		const { state, wrapper } = mountSearch({ query, searchAsYouType: true });
		query.value = 'release';
		await vi.runAllTimersAsync();
		query.value = 'release ';
		await vi.runAllTimersAsync();

		expect(mocks.apiGet).toHaveBeenCalledTimes(1);
		expect(state.results.value).toHaveLength(1);
		wrapper.unmount();
	});

	it('keeps partial results and surfaces one collection failure', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		mocks.useSettings.mockReturnValue({
			settings: ref({ searchMode: 'on_submit', collections: [], triggerRate: 0 }),
			collections: ref([collection('articles'), collection('news')]),
			valid: ref(true),
		});

		mocks.apiGet.mockImplementation((url: string) =>
			url.includes('articles')
				? Promise.resolve({ data: { data: [{ id: '1' }] } })
				: Promise.reject(new Error('offline')),
		);

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(state.results.value.map(({ collection }) => collection)).toEqual(['articles']);
		expect(mocks.notificationsAdd).toHaveBeenCalledOnce();
		wrapper.unmount();
	});

	it('signals a completed search even when elapsed time is zero', async () => {
		vi.spyOn(Date, 'now').mockReturnValue(1000);
		mocks.apiGet.mockResolvedValue({ data: { data: [] } });

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(state.info.time).toBe(0);
		expect(state.completedSearch.value?.query).toBe('article');
		wrapper.unmount();
	});

	it('normalizes a repeated route search query before the first request', async () => {
		mocks.route.query = { search: ['first', 'second'] };
		mocks.apiGet.mockResolvedValue({ data: { data: [] } });

		const { state, wrapper } = mountSearch({ syncWithQuery: true });
		await flushPromises();

		expect(state.query.value).toBe('first');
		expect(mocks.replace).toHaveBeenCalledWith({ query: { search: 'first' } });
		wrapper.unmount();
	});

	it('falls back to the collection display template and fetches its fields', async () => {
		mocks.getCollection.mockReturnValue({ meta: { display_template: '{{title}} by {{author.name}}' } });
		mocks.apiGet.mockResolvedValue({ data: { data: [{ id: 1, title: 'Article' }] } });

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(mocks.apiGet.mock.calls[0]?.[1].params.fields).toEqual(['id', 'title', 'author.name']);
		expect(state.results.value[0]?.displayTemplate).toBe('{{title}} by {{author.name}}');
		wrapper.unmount();
	});

	it('falls back to the primary key when no display template exists', async () => {
		mocks.apiGet.mockResolvedValue({ data: { data: [{ id: 1 }] } });

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(mocks.apiGet.mock.calls[0]?.[1].params.fields).toEqual(['id', 'id']);
		expect(state.results.value[0]?.displayTemplate).toBe('{{id}}');
		wrapper.unmount();
	});

	it('drops template fields the user cannot read', async () => {
		mocks.getCollection.mockReturnValue({ meta: { display_template: '{{title}} by {{author.name}}' } });
		mocks.getField.mockImplementation((_collection: string, field: string) => (field === 'title' ? {} : null));
		mocks.apiGet.mockResolvedValue({ data: { data: [{ id: 1, title: 'Article' }] } });

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(mocks.apiGet.mock.calls[0]?.[1].params.fields).toEqual(['id', 'title']);
		wrapper.unmount();
	});

	it('skips collections whose search fields the user cannot read', async () => {
		mocks.getField.mockReturnValue(null);

		const { state, wrapper } = mountSearch();
		await state.search('article');

		expect(mocks.apiGet).not.toHaveBeenCalled();
		expect(state.results.value).toEqual([]);
		wrapper.unmount();
	});
});
