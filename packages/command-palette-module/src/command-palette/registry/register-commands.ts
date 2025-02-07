import type {
	CommandConfig,
	CommandsAvailableCallback,
	GroupConfig,
	GroupsAvailableCallback,
} from './types';
import { markRaw } from 'vue';
import { commands, groups } from './registry';

export interface RegisterCommandsOptions {
	groups?: GroupConfig[] | GroupsAvailableCallback;
	commands?: CommandConfig[] | CommandsAvailableCallback;
}

export function defineCommands(
	options: RegisterCommandsOptions,
): RegisterCommandsOptions {
	return options;
}

export function registerCommands(...options: RegisterCommandsOptions[]) {
	for (const opt of options) {
		const { groups: newGroups = [], commands: newCommands = [] } = opt;

		const commandsCallback = markRaw(
			typeof newCommands === 'function'
				? newCommands
				: () => newCommands as CommandConfig[],
		);

		const groupsCallback = markRaw(
			typeof newGroups === 'function'
				? newGroups
				: () => newGroups as GroupConfig[],
		);

		groups.value.push(groupsCallback);
		commands.value.push(commandsCallback);
	}
}
