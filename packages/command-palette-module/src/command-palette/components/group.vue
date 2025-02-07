<script setup lang="ts">
import { CommandGroup } from '../../primitives/cmdk';
import GroupHeading from './group-heading.vue';

defineProps<{
	heading?: string;
	forceMount?: boolean;
}>();
</script>

<template>
	<CommandGroup :force-moun="forceMount">
		<template #heading>
			<slot name="heading">
				<GroupHeading>{{ heading }}</GroupHeading>
			</slot>
		</template>
		<slot />
	</CommandGroup>
</template>

<style scoped lang="scss">
[cmdk-group] {
}
</style>
