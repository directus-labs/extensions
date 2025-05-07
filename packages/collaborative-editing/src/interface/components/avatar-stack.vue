<script setup lang="ts">
import type { MaybeRef } from 'vue';
import { unref } from 'vue';
import UserAvatar from './user-avatar.vue';
import { AwarenessItem } from '../types';
const { users } = defineProps<{
	users: MaybeRef<AwarenessItem[]>;
	small?: boolean;
	right?: boolean;
}>();
</script>

<template>
	<div class="avatar-stack" :class="{ right, small }">
		<UserAvatar
			v-for="awareness in [...unref(users)].reverse() ?? []"
			:key="awareness.user.uid"
			:user="{
				...awareness.user,
				first_name: awareness.user.first_name ?? '',
				last_name: awareness.user.last_name ?? '',
				avatar: { id: awareness.user?.avatar ?? '' },
			}"
			class="avatar"
			:small="small"
		/>
	</div>
</template>

<style>
.avatar-stack-container {
	position: relative;
	display: inline-block;
	margin-left: 10px;
}
</style>

<style scoped>
.avatar-stack {
	display: flex;
	flex-direction: row-reverse;
	z-index: 10;
	position: relative;
}

.avatar-stack.small {
	margin-left: 4px;
	display: inline-flex;
}

.avatar {
	margin-right: -8px;
	position: relative;
	transition: all var(--fast);
}

.avatar:last-child {
	opacity: 1;
}

.avatar:first-child {
	margin-right: 0;
}

.avatar-stack:hover .avatar {
	margin-right: 4px;
	opacity: 1;
}

.avatar-stack.right {
	position: absolute;
	right: 0;
	top: 0;
}
</style>
