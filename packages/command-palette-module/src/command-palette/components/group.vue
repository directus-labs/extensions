<script setup lang="ts">
import { CommandGroup } from '../../primitives/cmdk';
import GroupHeading from './group-heading.vue';

defineProps<{
	heading?: string;
	icon?: string;
	forceMount?: boolean;
}>();
</script>

<template>
	<CommandGroup :force-mount="forceMount">
		<template #heading>
			<slot name="heading">
				<GroupHeading>
					<v-icon v-if="icon" :name="icon" />
					{{ heading }}
				</GroupHeading>
			</slot>
		</template>
		<slot />
	</CommandGroup>
</template>
