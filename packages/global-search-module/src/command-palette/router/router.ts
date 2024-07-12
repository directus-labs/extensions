import {
  Component,
  computed,
  DeepReadonly,
  inject,
  markRaw,
  provide,
  readonly,
  ref,
  Ref,
} from "vue";
import { commandRouterKey } from "./injection-symbols";
import {
  _CommandRouteProps,
  CommandLocation,
  NamedCommandLocation,
} from "./types";

type StackRoute = {
  name: string;
  component: Component;
  props?: _CommandRouteProps;
};

export type CommandRouterOptions = {
  root: Component;
  rootProps?: Record<string, any>;
};

export interface CommandRouter {
  stack: DeepReadonly<Ref<StackRoute>>;
  currentCommand: Ref<NamedCommandLocation>;

  push(location: CommandLocation): void;

  pop(): void;

  clear(): void;
}

export function createCommandRouter(
  options: CommandRouterOptions,
): CommandRouter {
  const stack: Ref<StackRoute[]> = ref([]);

  const currentCommand: Ref<NamedCommandLocation> = computed(
    () => stack.value[stack.value.length - 1] as NamedCommandLocation,
  );

  stack.value.push({
    name: "$root",
    component: markRaw(options.root),
    props: options.rootProps,
  });

  function push(location: CommandLocation) {
    const name =
      "name" in location ? location.name : location.component.name ?? "unnamed";

    stack.value.push({
      name,
      component: markRaw(location.component),
      props: location.props,
    });
  }

  function pop() {
    // Don't pop the root commands
    if (stack.value.length === 1) return;
    return !!stack.value.pop();
  }

  function clear() {
    stack.value = [stack.value[0]!];
  }

  return {
    stack: readonly(stack),
    currentCommand,
    push,
    pop,
    clear,
  };
}

export function provideCommandRouter(router: CommandRouter) {
  provide(commandRouterKey, router);
}

export function useCommandRouter() {
  const router = inject(commandRouterKey);

  if (!router) {
    throw new Error("No CommandRouter provided");
  }

  return router;
}
