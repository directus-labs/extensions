import type { AxiosError, AxiosResponse } from 'axios';
import { useStores } from '@directus/extensions-sdk';
import { useI18n } from 'vue-i18n';

type Response = AxiosResponse;
type RequestError = AxiosError & { response: Response };

interface APIError {
	message: string;
	extensions: {
		code: string;
		[key: string]: any;
	};
}

export function useUnexpectedError(context?: {
	stores: ReturnType<typeof useStores>;
	i18n: ReturnType<typeof useI18n>;
}) {
	const { useNotificationsStore } = context?.stores ?? useStores();
	const { t } = context?.i18n ?? useI18n();
	const store = useNotificationsStore();

	return (error: unknown) => {
		const code
      = (error as RequestError).response?.data?.errors?.[0]?.extensions?.code || (error as APIError)?.extensions?.code || 'UNKNOWN';

		console.warn(error);

		store.add({
			title: t(`errors.${code}`),
			type: 'error',
			code,
			dialog: true,
			error,
		});
	};
}
