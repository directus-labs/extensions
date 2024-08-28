import { Ref } from "vue";
import { createContext } from "../../primitives/cmdk/utils/create-context";
import { CommandRouter } from "../router";

export type GlobalCommandContext = {
  search: Ref<string>;
  loading: Ref<boolean>;
  router: CommandRouter;
  close(): void;
  clearSearch(): void;
};

export const [useCommandContext, provideGlobalCommandContext] =
  createContext<GlobalCommandContext>("GlobalCommand");
