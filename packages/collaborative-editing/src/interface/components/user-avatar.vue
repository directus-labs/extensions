<script setup lang="ts">
import { getAssetUrl } from '../utils';
import { computed, ref, toRefs } from 'vue';
import { themePrefix, AwarenessUser } from '../types';

const props = defineProps<{
	user: AwarenessUser;
	small?: boolean;
}>();

const { user } = toRefs(props);

const avatarSrc = computed(() => {
	return user.value?.avatar ? getAssetUrl(`${user.value.avatar}?key=system-small-cover`) : null;
});
const avatarError = ref(null);

const isUnknownUser = computed(() => {
	return !user.value?.first_name && !user.value?.last_name && !user.value?.avatar;
});
const name = computed(() => {
	if (isUnknownUser.value) {
		return 'Unknown User';
	}
	return `${user.value.first_name} ${user.value.last_name}`;
});

const initials = computed(() => {
	const first = user.value.first_name;
	const last = user.value.last_name;

	if (!first && !last) return '';
	if (!first) return last?.slice(0, 2).toUpperCase() ?? '';
	if (!last) return first?.slice(0, 2).toUpperCase() ?? '';
	return `${first[0]}${last[0]}`.toUpperCase();
});

const avatarBorderColor = computed(() => {
	return isUnknownUser.value ? 'var(--theme--foreground-subdued)' : `var(${themePrefix}${user.value.color})`;
});
const avatarBackgroundColor = computed(() => {
	return isUnknownUser.value ? 'var(--theme--background-accent)' : `var(${themePrefix}${user.value.color})`;
});
</script>

<template>
	<div
		v-tooltip.bottom="name"
		class="avatar"
		:class="{ small, ['unknown-user']: isUnknownUser }"
		:style="{
			backgroundColor: avatarBackgroundColor,
			borderColor: avatarBorderColor,
		}"
	>
		<div>
			<div v-if="isUnknownUser">
				<v-icon name="person_outline" class="unknown-user-icon" />
			</div>
			<div v-else>
				<v-image
					v-if="avatarSrc && !avatarError"
					:width="small ? '20px' : '24px'"
					:src="avatarSrc"
					@error="avatarError = $event"
				/>

				<div v-else class="initials">
					{{ initials }}
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.avatar {
	width: 28px;
	height: 28px;
	padding: 2px;
	border-radius: 50%;
	border-width: 2px;
	border-style: solid;
	cursor: default;
	display: flex;
	align-items: center;
	justify-content: center;
	outline: 2px solid #fff;
}

.avatar.small {
	width: 22px;
	height: 22px;
	padding: 1px;
}

.avatar div {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.avatar.small div {
	width: 100%;
	height: 100%;
}

.initials {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	font-size: 12px;
	font-weight: 600;
	color: var(--theme--foreground-accent, #172940);
	font-family: var(--fonts-family-sans, Inter);
	text-align: center;
	line-height: 1;
}

.avatar.small .initials {
	font-size: 0.75rem;
	font-style: normal;
	font-weight: 600;
	line-height: 0.9375rem; /* 125% */
}

.unknown-user-icon {
	color: var(--theme--foreground-subdued);
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}
</style>
