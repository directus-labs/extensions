<script setup lang="ts">
import { getAssetUrl } from '../utils';
import { computed, ref, toRefs } from 'vue';

const props = defineProps<{
	user: {
		first_name: string;
		last_name: string;
		avatar: { id: string };
		color: string;
	};
	small?: boolean;
}>();
const { user } = toRefs(props);

const avatarSrc = computed(() => {
	return user.value?.avatar?.id ? getAssetUrl(`${user.value.avatar.id}?key=system-small-cover`) : null;
});
const avatarError = ref(null);
const name = computed(() => `${user.value.first_name} ${user.value.last_name}`);

const initials = computed(() => {
	const first = user.value.first_name;
	const last = user.value.last_name;

	if (!first && !last) return '';
	if (!first) return last.slice(0, 2).toUpperCase();
	if (!last) return first.slice(0, 2).toUpperCase();
	return `${first[0]}${last[0]}`.toUpperCase();
});
</script>

<template>
	<div
		v-tooltip.bottom="name"
		class="avatar"
		:class="{ small }"
		:style="{
			backgroundColor: user.color,
		}"
	>
		<div>
			<v-image
				v-if="avatarSrc && !avatarError"
				:width="small ? '20px' : '24px'"
				:src="avatarSrc"
				@error="avatarError = $event"
			/>
			<div class="initials">
				{{ initials }}
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
	cursor: default;
}

.avatar.small {
	width: 22px;
	height: 22px;
	padding: 1px;
}

.avatar div {
	object-fit: contain;
	width: 24px;
	height: 24px;
	border-radius: 50%;
	overflow: hidden;
}

.avatar.small div {
	width: 20px;
	height: 20px;
}

.initials {
	font-size: 12px;
	font-weight: 600;
	color: white;
	text-align: center;
	line-height: 24px;
	padding-top: 1px;
	padding-right: 1px;
}

.avatar.small .initials {
	font-size: 10px;
	line-height: 18px;
	padding-top: 0;
	padding-right: 0;
}
</style>
