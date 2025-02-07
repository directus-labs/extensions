// CORE-CHANGE start
// import type { RequestError } from "@/api";
import type { RequestError } from '../types/api';
// import type { APIError } from "@/types/error";
import type { APIError } from '../types/error';
// import { useNotificationsStore } from '@/stores/notifications';
import { useStores } from '@directus/extensions-sdk';
// import { i18n } from '@/lang';
import { useI18n } from 'vue-i18n';
// CORE-CHANGE end

let store: any;

export function unexpectedError(error: unknown): void {
	// CORE-CHANGE start
	const { useNotificationsStore } = useStores();
	// CORE-CHANGE end

	if (!store)
		store = useNotificationsStore();

	const code
        = (error as RequestError).response?.data?.errors?.[0]?.extensions?.code || (error as APIError)?.extensions?.code || 'UNKNOWN';

	console.warn(error);

	store.add({
		// CORE-CHANGE start
		// title: i18n.global.t(`errors.${code}`),
		title: useI18n().t(`errors.${code}`),
		// CORE-CHANGE end
		type: 'error',
		code,
		dialog: true,
		error,
	});
}
