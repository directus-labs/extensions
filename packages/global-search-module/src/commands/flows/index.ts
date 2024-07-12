import { Flow } from "@directus/types";
import { defineCommands } from "../../command-palette";
import SearchRunFlows from "./search-flows-command.vue";

export const flowCommands = defineCommands({
  groups: [
    {
      id: "flows",
      name: "Flows",
    },
  ],
  commands: ({ stores }) => {
    const { useUserStore } = stores;
    const userStore = useUserStore();

    const isAdmin =
      userStore.currentUser?.admin_access ??
      userStore.currentUser?.role?.admin_access ??
      false;

    return [
      {
        id: "run-manual-flow",
        name: "Run Manual Flow...",
        icon: "bolt",
        group: "flows",
        component: SearchRunFlows,
      },
      ...(isAdmin
        ? [
            {
              id: "create-flow",
              name: "Create Flow",
              icon: "add",
              group: "flows",
              action: ({ router }) => {
                router.push("/settings/flows");
              },
            },
          ]
        : []),
    ];
  },
});

export const collectionItemFlowCommands = defineCommands({
  groups: [
    {
      id: "context",
      name: "Context",
    },
  ],
  commands: ({ route, stores }) => {
    const { collection, primaryKey } = route.params;

    if (!collection) {
      return [];
    }

    const location = primaryKey ? "item" : "collection";

    const { useFlowsStore } = stores;
    const flowsStore = useFlowsStore();

    const flows = flowsStore
      .getManualFlowsForCollection(collection)
      .filter(
        (flow: Flow) =>
          !flow.options?.location ||
          flow.options?.location === "both" ||
          flow.options?.location === location,
      )
      .map((flow: Flow) => ({
        ...flow,
        options: flow.options,
      }));

    return flows.map((flow: Flow) => ({
      id: `run-flow-${flow.id}`,
      name: `Run *${flow.name}*`,
      icon: flow.icon ?? "bolt",
      keywords: ["context"],
      group: "context",
      action: () => {
        console.log("Run flow", flow.id);
      },
    }));
  },
});
