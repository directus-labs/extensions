import { uniqBy } from "lodash-es";
import { computed, markRaw, MaybeRef, ref, Ref, unref, watch } from "vue";
import { commands, groups } from "./registry";
import {
  CommandAvailableContext,
  CommandConfig,
  GroupConfig,
  isCommandConfigBefore,
} from "./types";

export function useRegisteredCommands(
  context: MaybeRef<CommandAvailableContext>,
) {
  const internalCommands: Ref<CommandConfig[]> = ref([]);
  const internalGroups: Ref<GroupConfig[]> = ref([]);

  // TODO sorting with before and after
  watch(
    [context, commands],
    () => {
      internalCommands.value = collect<CommandConfig>(
        unref(context),
        unref(commands),
        (command) =>
          ({
            ...command,
            ...(command.component
              ? { component: markRaw(command.component) }
              : {}),
          }) as CommandConfig,
      );
    },
    { immediate: true },
  );

  watch(
    [context, groups],
    () => {
      internalGroups.value = collect(unref(context), unref(groups));
    },
    { immediate: true },
  );

  const sortedCommands = computed(() => {
    const uniqCommands = uniqBy(internalCommands.value, "id");

    const beforeRegexes = Object.fromEntries(
      uniqCommands.map((command) => [
        command.id,
        isCommandConfigBefore(command) && command.before
          ? new RegExp(command.before.replace("*", ".+?"))
          : null,
      ]),
    );

    uniqCommands.sort((a, b) => {
      if (
        isCommandConfigBefore(a) &&
        isCommandConfigBefore(b) &&
        a.before === b.before
      )
        return 0;

      if (isCommandConfigBefore(a) && a.before) {
        if (a.before === "*") return -1;
        const re = beforeRegexes[a.id]!;
        if (re.test(b.id)) return -1;
      }

      if (isCommandConfigBefore(b) && b.before) {
        if (b.before === "*") return 1;
        const re = beforeRegexes[b.id]!;
        if (re.test(a.id)) return -1;
      }

      return 0;
    });

    return uniqCommands;
  });

  return {
    groups: computed(() => uniqBy(internalGroups.value, "id")),
    commands: sortedCommands,
  };

  function collect<T>(
    context: CommandAvailableContext,
    callbacks: ((context: CommandAvailableContext) => Promise<T[]> | T[])[],
    transform: (command: T) => T = (c) => c,
  ) {
    const result: T[] = [];

    for (const cb of callbacks) {
      const commands = cb(context);

      if (commands instanceof Promise) {
        commands.then((newCommands) => {
          result.push(...newCommands.map(transform));
        });
      } else {
        result.push(...commands.map(transform));
      }
    }

    return result;
  }
}
