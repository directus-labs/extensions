import {Raw, ref, Ref} from "vue";
import {CommandsAvailableCallback, GroupsAvailableCallback} from "./types";

export const groups: Ref<GroupsAvailableCallback[]> = ref([])
export const commands: Ref<Raw<CommandsAvailableCallback>[]> = ref([])
