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
			:user="awareness.user"
			class="user-avatar"
			:small="small"
		/>
	</div>
</template>

<style>
.title-container:has(~ .actions.active) .header-avatars-container {
	display: none;
}
.header-avatars-container {
	position: relative;
	display: inline-block;
	margin-left: auto;
	margin-right: 4px;
}

.field-avatar-container {
	position: absolute;
	right: 0;
	top: 0;
}
</style>

<style scoped>
.avatar-stack {
	display: flex;
	flex-direction: row-reverse;
	z-index: 10;
	position: relative;
}

.user-avatar {
	margin-right: -2px;
	position: relative;
	transition: all var(--fast);
}

.user-avatar:last-child {
	opacity: 1;
}

.user-avatar:first-child {
	margin-right: 0;
}

.avatar-stack:hover .user-avatar {
	margin-right: 4px;
	opacity: 1;
}

.avatar-stack.right {
	position: absolute;
	right: 0;
	top: 0;
}
</style>
