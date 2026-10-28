import { useStores } from '@directus/extensions-sdk';
import { computed, nextTick } from 'vue';
import { getDirectusApp } from '../../utils/get-directus-app';
import { useCommandContext } from './use-global-command-state';

interface AiStore {
	input: string;
	chatOpen: boolean;
	focusInput?: () => void;
}

// The app doesn't hand its AI store to extensions, and only creates it when AI is enabled (11.14+). Never create it here.
function getAiStore(): AiStore | undefined {
	const pinia = getDirectusApp()?.config?.globalProperties?.$pinia;

	// Pinia's store registry isn't reactive, but its state is. Reading the entry first lets callers re-run once the
	// app creates the store.
	if (!pinia?.state?.value?.['ai-store']) return;

	return pinia._s.get('ai-store');
}

export function useAskAi() {
	const { search, close } = useCommandContext();
	const stores = useStores();
	const serverStore = stores.useServerStore();
	const settingsStore = stores.useSettingsStore();

	// Directus 12 lists providers on the server info; 11.14 – 11.17 derive them from settings.
	const aiEnabled = computed(() => {
		const providers: string[] = serverStore.info?.ai_providers ?? settingsStore.availableAiProviders ?? [];
		return serverStore.info?.ai_enabled === true && providers.length > 0;
	});

	const visible = computed(() => search.value.trim() !== '' && aiEnabled.value && getAiStore() !== undefined);

	function askAi() {
		const aiStore = getAiStore();
		const query = search.value.trim();
		if (!visible.value || !aiStore) return;

		aiStore.input = query;
		aiStore.chatOpen = true;
		close();

		// Before 11.17 the store has no focusInput.
		nextTick(() => {
			if (typeof aiStore.focusInput === 'function') aiStore.focusInput();
		});
	}

	return { visible, askAi };
}
