import {InjectionKey} from "vue";
import {CommandRouter} from "./router";

export const commandRouterKey: InjectionKey<CommandRouter> = Symbol('CommandRouter');
export const commendRouteLocationKey: InjectionKey<string> = Symbol('CommandRouteLocation');
