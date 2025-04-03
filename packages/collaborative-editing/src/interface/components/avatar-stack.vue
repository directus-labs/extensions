<script setup lang="ts">
import type { MaybeRef } from 'vue';
import { computed, Ref, unref, watch } from 'vue';
import UserAvatar from './user-avatar.vue';

const { users } = defineProps<{
	users: MaybeRef<{ id: string; color: string; first_name: string; last_name: string }[]>;
	small?: boolean;
	right?: boolean;
}>();
</script>

<template>
	<div class="avatar-stack" :class="{ right }">
		<UserAvatar v-for="user in [...unref(users)].reverse() ?? []" :key="user.id" :user="user" class="avatar" :small="small" />
	</div>
</template>

<style scoped>
.avatar-stack {
	margin-left: 12px;
	display: flex;
	flex-direction: row-reverse;
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
