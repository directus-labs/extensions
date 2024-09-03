import { useStores } from "@directus/extensions-sdk";
import type { AxiosError, AxiosResponse } from "axios";
import { useI18n } from "vue-i18n";

type Response = AxiosResponse;
type RequestError = AxiosError & { response: Response };

type APIError = {
  message: string;
  extensions: {
    code: string;
    [key: string]: any;
  };
};

export function useUnexpectedError(context?: {
  stores: ReturnType<typeof useStores>;
  i18n: ReturnType<typeof useI18n>;
}) {
  const { useNotificationsStore } = context?.stores ?? useStores();
  const { t } = context?.i18n ?? useI18n();
  const store = useNotificationsStore();

  return (error: unknown) => {
    const code =
      (error as RequestError).response?.data?.errors?.[0]?.extensions?.code ||
      (error as APIError)?.extensions?.code ||
      "UNKNOWN";

    // eslint-disable-next-line no-console
    console.warn(error);

    store.add({
      title: t(`errors.${code}`),
      type: "error",
      code,
      dialog: true,
      error,
    });
  };
}
