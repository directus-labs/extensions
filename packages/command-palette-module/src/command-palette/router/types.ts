import type { Component } from 'vue';

export type CommandRoutePropFunction = (
	to: NamedCommandLocation,
) => Record<string, any>;
export type _CommandRouteProps = Record<string, any> | CommandRoutePropFunction;

export interface CommandLocationRaw {
	component: Component;
	props?: _CommandRouteProps;
}

export type NamedCommandLocation = CommandLocationRaw & {
	name: string;
};

export type CommandLocation = CommandLocationRaw | NamedCommandLocation;
