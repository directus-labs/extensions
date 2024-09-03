import { defineCommands } from "../command-palette";
import { getPublicURL } from "../utils/get-root-path";

export const copyApiUrlCommands = defineCommands({
  commands: ({ route }) => {
    const { collection, primaryKey } = route.params as {
      collection: string | undefined;
      primaryKey: string | undefined;
    };

    if (collection) {
      return [
        {
          id: "copy-api-url",
          name: "Copy API URL",
          icon: "content_copy",
          group: "context",
          action: () => {
            const path = `items/${collection}${
              primaryKey ? `/${primaryKey}` : ""
            }`;

            const url = new URL(path, getPublicURL());
            navigator.clipboard?.writeText(url.toString());
          },
        },
      ];
    } else {
      return [];
    }
  },
});
