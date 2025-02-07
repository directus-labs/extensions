import type { Raw, Ref } from 'vue';
import type { CommandsAvailableCallback, GroupsAvailableCallback } from './types';
import { ref } from 'vue';

export const groups: Ref<GroupsAvailableCallback[]> = ref([]);
export const commands: Ref<Raw<CommandsAvailableCallback>[]> = ref([]);
