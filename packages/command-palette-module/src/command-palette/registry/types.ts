import type { useApi, useStores } from '@directus/extensions-sdk';
import type { Component, VNode } from 'vue';
import type { VueI18n } from 'vue-i18n';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { _CommandRouteProps } from '../router/types';

interface CommandConfigCommon {
	id: string;
	name: string;
	icon: string | (() => VNode);
	render?: () => VNode | VNode[];
	description?: string;
	group?: string;
	keywords?: string[];
}

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

export interface CommandActionContext {
	router: Router;
}

export type CommandConfigWithAction = CommandConfigBase & {
	action: (
		context: CommandActionContext,
	) => Promise<boolean | undefined> | boolean | undefined;

	component?: never;
	props?: never;
};

export type CommandConfigWithView = CommandConfigBase & {
	action?: never;

	component: Component;
	props?: _CommandRouteProps;
};

export type CommandConfig = CommandConfigWithAction | CommandConfigWithView;

interface GroupConfigBase {
	id: string;
	name: string;
}

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

export interface CommandAvailableContext {
	route: RouteLocationNormalizedLoaded;
	stores: ReturnType<typeof useStores>;
	api: ReturnType<typeof useApi>;
	i18n: VueI18n;
	search: string;
}

export type CommandsAvailableCallback = (
	context: CommandAvailableContext,
) => Promise<CommandConfig[]> | CommandConfig[];
export type GroupsAvailableCallback = (
	context: CommandAvailableContext,
) => Promise<GroupConfig[]> | GroupConfig[];

export function isCommandConfigBefore(
	config: CommandConfigBase,
): config is CommandConfigBefore {
	return 'before' in config;
}
