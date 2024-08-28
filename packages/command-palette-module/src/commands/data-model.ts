import { formatTitle } from "@directus/format-title";
import { Collection } from "@directus/types";
import { CommandActionContext } from "../command-palette";
import { CommandConfig, defineCommands } from "../command-palette/registry";
import { isAdminFromStores } from "../utils/is-admin";

export const dataModelCommands = defineCommands({
  groups: [
    {
      id: "data-model",
      name: "Data Model",
    },
  ],
  commands: ({ stores }) => {
    const isAdmin = isAdminFromStores(stores);

    if (!isAdmin) return [];

    const { useCollectionsStore } = stores;
    const collectionStore = useCollectionsStore();

    return [
      {
        id: "create-collection",
        name: "Create Collection",
        icon: "add",
        group: "data-model",
        keywords: ["data", "model"],
        action: ({ router }) => {
          router.push("/settings/data-model/+");
        },
      },
      ...collectionStore.allCollections.map(
        ({ collection, meta }: Collection) =>
          editCollectionCommand(collection, {
            group: meta?.hidden ? "data-model" : `collection:${collection}`,
          }),
      ),
    ];
  },
});

function editCollectionCommand(
  collection: string,
  overrides?: Partial<CommandConfig>,
) {
  return {
    id: `edit-collection:${collection}`,
    name: `Configure ${formatTitle(collection)}`,
    icon: "settings",
    keywords: ["data", "model"],
    action: ({ router }: CommandActionContext) => {
      router.push(`/settings/data-model/${collection}`);
    },
    ...overrides,
  };
}
