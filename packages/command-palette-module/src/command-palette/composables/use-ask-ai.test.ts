import type { Pinia } from 'pinia';
import { createPinia, defineStore } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';
import { useAskAi } from './use-ask-ai';

const search = ref('');
const close = vi.fn();
const server = reactive<{ info: Record<string, any> }>({ info: {} });
const settings = reactive<Record<string, any>>({});
let pinia: Pinia;

vi.mock('@directus/extensions-sdk', () => ({
	useStores: () => ({
		useServerStore: () => server,
		useSettingsStore: () => settings,
	}),
}));

vi.mock('./use-global-command-state', () => ({ useCommandContext: () => ({ search, close }) }));

vi.mock('../../utils/get-directus-app', () => ({
	getDirectusApp: () => ({ config: { globalProperties: { $pinia: pinia } } }),
}));

// Mirrors the app's setup store. `focusInput` only exists from 11.17.
function createAiStore(extra: Record<string, unknown> = {}) {
	return defineStore('ai-store', () => ({ input: ref(''), chatOpen: ref(false), ...extra }))(pinia) as any;
}

function setHost({ info = {}, availableAiProviders, aiStore }: { info?: Record<string, any>; availableAiProviders?: string[]; aiStore?: boolean }) {
	server.info = info;
	delete settings.availableAiProviders;
	if (availableAiProviders) settings.availableAiProviders = availableAiProviders;
	return aiStore ? createAiStore() : undefined;
}

beforeEach(() => {
	pinia = createPinia();
	search.value = 'summarize this';
	close.mockReset();
});

describe('useAskAi visibility', () => {
	it.each([
		['v12 with a provider', { info: { ai_enabled: true, ai_providers: ['openai'] }, aiStore: true }, true],
		['v12 without providers', { info: { ai_enabled: true, ai_providers: [] }, aiStore: true }, false],
		['v12 with AI disabled', { info: { ai_enabled: false, ai_providers: ['openai'] }, aiStore: true }, false],
		['v11 with a provider', { info: { ai_enabled: true }, availableAiProviders: ['anthropic'], aiStore: true }, true],
		['v11 without providers', { info: { ai_enabled: true }, availableAiProviders: [], aiStore: true }, false],
		['no AI store', { info: { ai_enabled: true, ai_providers: ['openai'] } }, false],
		['host without AI (11.6 – 11.13)', { info: {} }, false],
	])('%s', (_, host, expected) => {
		setHost(host);
		expect(useAskAi().visible.value).toBe(expected);
	});

	it('hides for an empty or blank query', () => {
		setHost({ info: { ai_enabled: true, ai_providers: ['openai'] }, aiStore: true });
		const { visible } = useAskAi();

		search.value = '';
		expect(visible.value).toBe(false);

		search.value = '   ';
		expect(visible.value).toBe(false);
	});

	it('shows once the app creates the AI store, without a query change', () => {
		setHost({ info: { ai_enabled: true, ai_providers: ['openai'] } });
		const { visible } = useAskAi();
		expect(visible.value).toBe(false);

		createAiStore();
		expect(visible.value).toBe(true);
	});

	it('never creates the AI store itself', () => {
		setHost({ info: { ai_enabled: true, ai_providers: ['openai'] } });
		const { visible, askAi } = useAskAi();
		void visible.value;
		askAi();

		expect(pinia.state.value['ai-store']).toBeUndefined();
	});
});

describe('useAskAi select', () => {
	it('fills the assistant input, opens the chat, closes the palette, then focuses the input', async () => {
		setHost({ info: { ai_enabled: true, ai_providers: ['openai'] } });
		const focusInput = vi.fn();
		const store = createAiStore({ focusInput });
		search.value = '  summarize this  ';

		useAskAi().askAi();

		expect(store.input).toBe('summarize this');
		expect(store.chatOpen).toBe(true);
		expect(close).toHaveBeenCalledOnce();
		expect(focusInput).not.toHaveBeenCalled();

		await nextTick();
		expect(focusInput).toHaveBeenCalledOnce();
	});

	it('works without focusInput (11.14 – 11.16)', async () => {
		const store = setHost({ info: { ai_enabled: true }, availableAiProviders: ['openai'], aiStore: true });

		useAskAi().askAi();
		await nextTick();

		expect(store.chatOpen).toBe(true);
		expect(close).toHaveBeenCalledOnce();
	});

	it('does nothing when AI is unavailable', () => {
		const store = setHost({ info: { ai_enabled: true, ai_providers: [] }, aiStore: true });

		useAskAi().askAi();

		expect(store.chatOpen).toBe(false);
		expect(close).not.toHaveBeenCalled();
	});
});
