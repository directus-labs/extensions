import type { Component, VNode } from "vue";
import type { VueI18n } from "vue-i18n";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";
import type { _CommandRouteProps } from "../router/types";

type CommandConfigCommon = {
  id: string;
  name: string;
  icon: string | (() => VNode);
  render?: () => VNode | VNode[];
  description?: string;
  group?: string;
  keywords?: string[];
};

type CommandConfigBefore = CommandConfigCommon & {
  before: string;
  after?: never;
};

type CommandConfigAfter = CommandConfigCommon & {
  before?: never;
  after: string;
};

type CommandConfigBase =
  | CommandConfigCommon
  | CommandConfigBefore
  | CommandConfigAfter;

export type CommandActionContext = {
  router: Router;
};

export type CommandConfigWithAction = CommandConfigBase & {
  action: (
    context: CommandActionContext,
  ) => Promise<boolean | void> | boolean | void;

  component?: never;
  props?: never;
};

export type CommandConfigWithView = CommandConfigBase & {
  action?: never;

  component: Component;
  props?: _CommandRouteProps;
};

export type CommandConfig = CommandConfigWithAction | CommandConfigWithView;

type GroupConfigBase = {
  id: string;
  name: string;
};

type GroupConfigBefore = GroupConfigBase & {
  before: string;
  after?: never;
};

type GroupConfigAfter = GroupConfigBase & {
  before?: never;
  after: string;
};

export type GroupConfig =
  | GroupConfigBase
  | GroupConfigBefore
  | GroupConfigAfter;

export type CommandAvailableContext = {
  route: RouteLocationNormalizedLoaded;
  stores: any;
  i18n: VueI18n;
  search: string;
};

export type CommandsAvailableCallback = (
  context: CommandAvailableContext,
) => Promise<CommandConfig[]> | CommandConfig[];
export type GroupsAvailableCallback = (
  context: CommandAvailableContext,
) => Promise<GroupConfig[]> | GroupConfig[];
