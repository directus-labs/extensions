<script setup lang="ts">
import type { MaybeRef } from 'vue';
import { unref, onMounted, onUnmounted } from 'vue';
import UserAvatar from './user-avatar.vue';
import { AwarenessItem } from '../types';

const { users } = defineProps<{
	users: MaybeRef<AwarenessItem[]>;
	right?: boolean;
}>();

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
	// Avatar placement
	// Align with form edge while preventing spacer in header from overlapping.
	const headerBar = document.querySelector('.header-bar');
	const avatarContainer = document.querySelector('.header-avatars-container');
	const spacer = document.querySelector('.header-bar .spacer');

	if (headerBar && avatarContainer && spacer) {
		resizeObserver = new ResizeObserver(() => {
			const spacerRect = spacer.getBoundingClientRect();
			const avatarRect = avatarContainer.getBoundingClientRect();
			const windowWidth = window.innerWidth;

			// Calculate distance from right edge to window for both elements
			const spacerDistance = windowWidth - spacerRect.right;
			const avatarDistance = windowWidth - avatarRect.right;

			// Calculate the offset needed to maintain 4px gap if
			const offset = spacerDistance - avatarDistance;

			if (offset > 0) {
				(avatarContainer as HTMLElement).style.transform = `translateX(-${offset}px)`;
			} else {
				(avatarContainer as HTMLElement).style.transform = 'translateX(0)';
			}
		});

		resizeObserver.observe(headerBar);
	}
});

onUnmounted(() => {
	if (resizeObserver) {
		resizeObserver.disconnect();
	}
});
</script>

<template>
	<div class="avatar-stack" :class="{ right }">
		<UserAvatar
			v-for="awareness in [...unref(users)].reverse() ?? []"
			:key="awareness.user.uid"
			:user="awareness.user"
			class="user-avatar"
		/>
	</div>
</template>

<style>
.title-container:has(~ .actions.active) .header-avatars-container {
	display: none;
}
.header-avatars-container {
	position: absolute;
	left: 0;
	right: 0;
	max-width: calc(var(--form-column-max-width) * 2 - var(--theme--form--column-gap));
	display: inline-block;
	padding-right: 2px;
}

.field-avatar-container {
	position: absolute;
	right: 0;
	top: -4px;
}

.v-item.accordion-section .field-avatar-container {
	margin-top: -30px;
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

.header-avatars-container .user-avatar {
	margin-right: -8px;
}

.header-avatars-container .user-avatar:first-child {
	margin-right: 0;
}

.header-avatars-container .user-avatar:hover {
	margin-right: 2px;
}

.user-avatar:first-child {
	margin-right: 0;
}

.user-avatar:hover {
	margin-right: 4px;
}

.avatar-stack.right {
	position: absolute;
	right: 0;
	top: 0;
}
</style>
