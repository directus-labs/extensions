import type { useApi, useStores } from '@directus/extensions-sdk';
import type { Component, VNode } from 'vue';
import type { useI18n } from 'vue-i18n';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { _CommandRouteProps } from '../router/types';

interface CommandConfigCommon {
	id: string;
	name: string;
	icon: string | (() => VNode);
	render?: () => VNode | VNode[];
	description?: string;
	endLabel?: string;
	group?: string;
	keywords?: string[];
	priority?: number;
}

type Position =
	| { before: string; after?: never }
	| { before?: never; after: string }
	| { before?: never; after?: never };

type CommandConfigBase = CommandConfigCommon & Position;

export interface CommandActionContext {
	router: Router;
}

export type CommandConfigWithAction = CommandConfigBase & {
	action: (context: CommandActionContext) => unknown;
	component?: never;
	props?: never;
};

export type CommandConfigWithView = CommandConfigBase & {
	action?: never;
	component: Component;
	props?: _CommandRouteProps;
};

export type CommandConfig = CommandConfigWithAction | CommandConfigWithView;

interface GroupConfigCommon {
	id: string;
	name: string;
	icon?: string;
}

export type GroupConfig = GroupConfigCommon & Position;

export type CommandI18n = Pick<ReturnType<typeof useI18n>, 't' | 'te'>;

export interface CommandAvailableContext {
	route: RouteLocationNormalizedLoaded;
	stores: ReturnType<typeof useStores>;
	api: ReturnType<typeof useApi>;
	i18n: CommandI18n;
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
): config is CommandConfigBase & { before: string; after?: never } {
	return typeof config.before === 'string';
}
