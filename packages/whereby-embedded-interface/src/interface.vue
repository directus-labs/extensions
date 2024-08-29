<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useStores } from '@directus/extensions-sdk';
import { formatRelative, isPast } from 'date-fns';
import { useClipboard } from '@vueuse/core';
import { getPublicURL } from './get-root-path';

interface Props {
	value?: {
		startDate: string;
		endDate: string;
		roomName: string;
		roomUrl: string;
		meetingId: string;
		hostRoomUrl?: string;
		viewerRoomUrl?: string;
	};
}

const props = defineProps<Props>();

const valuesLoaded = ref(false);
const { useUserStore } = useStores();
const userStore = useUserStore();

const loadMeeting = ref(false);

const { copy: copyToClipboard } = useClipboard();

onMounted(() => {
	const script = document.createElement('script');
	script.src = 'https://cdn.srv.whereby.com/embed/v2-embed.js';
	script.type = 'module';
	document.head.appendChild(script);

	script.onload = () => {
		valuesLoaded.value = true;
	};
});

const embedUrl = computed(() => {
	return props.value?.hostRoomUrl || props.value?.roomUrl || '';
});

const roomName = computed(() => {
	return props.value?.roomName?.replace(/[^a-zA-Z0-9]/g, '') || 'Meeting Room';
});

const expirationDate = computed(() => {
	if (props.value?.endDate) {
		return formatRelative(new Date(props.value.endDate), new Date());
	}

	return 'Not set';
});

const isExpired = computed(() => {
	return props.value?.endDate && isPast(new Date(props.value.endDate));
});

const openUrl = (url: string) => {
    if (!url) return;
	window.open(url, '_blank');
};

const menuItems = computed(() => {
  const items = [
    {
      icon: "content_copy",
      text: "Copy Room URL",
      action: () => copyToClipboard(props.value?.roomUrl || ""),
    },
    {
      icon: "open_in_new",
      text: "Open Room URL",
      action: () => openUrl(props.value?.roomUrl || ""),
    },
  ];

  if (props.value?.hostRoomUrl) {
    items.push({
      icon: "admin_panel_settings",
      text: "Open Host Room URL",
      action: () => openUrl(props.value?.hostRoomUrl ?? ""),
    });
  }

  if (props.value?.viewerRoomUrl) {
    items.push({
      icon: "visibility",
      text: "Open Viewer Room URL",
      action: () => openUrl(props.value?.viewerRoomUrl ?? ""),
    });
  }
  return items;
});

const componentState = computed(() => {
  if (!props.value || !props.value.roomUrl) {
    return "no-data";
  }

  if (isExpired.value) {
    return "expired";
  }

  return "valid";
});

const avatarUrl = computed(() => {
	const baseUrl = getPublicURL();
	return `${baseUrl}assets/${userStore.currentUser?.avatar?.id}`;
});
</script>

<template>
	<div class="whereby-container interface bordered">
		<div class="header">
			<p class="selectable id">{{ roomName }}</p>
			<div class="expiration" :class="{ expired: isExpired }">{{ isExpired ? 'Expired': 'Expires' }} {{ expirationDate }}</div>
			<v-menu :disabled="componentState === 'no-data'" show-arrow placement="bottom-end">
				<template #activator="{ toggle }">
					<v-icon name="more_vert" clickable @click="toggle" />
				</template>
				<v-list>
					<v-list-item v-for="(item, index) in menuItems" :key="index" clickable @click="item.action">
						<v-icon :name="item.icon" />
						{{ item.text }}
					</v-list-item>
				</v-list>
			</v-menu>
		</div>

		<div v-if="componentState === 'no-data'" class="info-box">
			<v-info type="danger" title="Missing Whereby Data" icon="warning">
				There is no Whereby data available or some required data is missing. Please contact an administrator.
			</v-info>
		</div>

		<div v-else-if="componentState === 'valid' && !loadMeeting" class="info-box">
			<v-info type="success" title="Meeting Ready" icon="meeting_room">Your Whereby meeting is ready to start.</v-info>
			<v-button class="start-meeting" color="primary" size="large" block @click="loadMeeting = true">
				Start Meeting
			</v-button>
		</div>

		<div v-else-if="componentState === 'expired' && !loadMeeting" class="info-box">
			<v-info type="warning" title="Meeting Expired" icon="history">
				This meeting has expired. You may still attempt to join, but it may not be accessible.
			</v-info>
			<v-button class="start-meeting" color="secondary" size="large" block @click="loadMeeting = true">
				Attempt to Join Expired Meeting
			</v-button>
		</div>

		<template v-if="valuesLoaded && loadMeeting && embedUrl">
			<!-- Whereby Embed breaks if you hyphenate attributes like Vue expects -->
			<!-- eslint-disable vue/attribute-hyphenation -->
			<whereby-embed
				class="whereby"
				:room="embedUrl"
				:avatarUrl="avatarUrl"
				:displayName="userStore.fullName"
				:externalId="userStore.currentUser?.id"
			></whereby-embed>
		</template>
	</div>
</template>

<style scoped>
.whereby-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px;
	background-color: var(--theme--background-subdued);
	border-bottom: var(--theme--border-width) solid var(--theme--border-color);
	border-radius: var(--theme--border-radius) var(--theme--border-radius) 0 0;
}

.header .id {
	font-family: var(--theme--fonts--monospace--font-family);
	font-weight: var(--theme--fonts--monospace--font-weight);
}
.header h3 {
	margin: 0;
	font-size: 1.2em;
}
.expiration {
	font-size: 0.9em;
	color: var(--theme--foreground-subdued);
}
.expiration.expired {
	color: var(--theme--danger);
}
.whereby {
	width: 100%;
	height: 100%;
	min-height: 600px;
	aspect-ratio: 16/9;
}
.bordered {
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
}
.start-meeting {
	margin: 10px;
}

.info-box {
	width: 100%;
	padding: var(--theme--form--row-gap);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}
</style>
