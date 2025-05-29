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
	<div v-tooltip.bottom="name" class="avatar-container" :class="{ small, ['unknown-user']: isUnknownUser }">
		<div>
			<div
				class="avatar"
				:style="{
					backgroundColor: avatarBackgroundColor,
					borderColor: avatarBorderColor,
				}"
			>
				<template v-if="isUnknownUser">
					<v-icon name="person_outline" class="unknown-user-icon" />
				</template>
				<template v-else>
					<v-image v-if="avatarSrc && !avatarError" :src="avatarSrc" @error="avatarError = $event" />
					<div v-else class="initials">
						{{ initials }}
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<style scoped>
.avatar {
	border-radius: 50%;
	border-width: 1.5px;
	border-style: solid;
	cursor: default;
	outline: 1.5px solid #fff;

	display: flex;
	width: 24px;
	height: 24px;
	justify-content: center;
	align-items: center;
	gap: 0.46875rem;
	flex-shrink: 0;
	aspect-ratio: 1/1;

	color: var(--theme--foreground-accent, #172940);
	font-family: var(--theme--fonts--sans--font-family, Inter);
	text-align: center;
	font-size: 0.5625rem;
	font-weight: 600;
}

.avatar > img,
.avatar > .unknown-user-icon,
.avatar > .initials {
	border-radius: 50%;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

.initials {
	line-height: 1;
	display: flex;
	align-items: center;
	justify-content: center;

	/* the font itself has spacing that prevents it from being perfectly centered */
	letter-spacing: -0.015em;
	transform: translateY(0.5px);
}
</style>
