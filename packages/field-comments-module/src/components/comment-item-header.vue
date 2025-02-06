<script setup lang="ts">
import type { Activity } from '../types';
import { useApi, useStores } from '@directus/extensions-sdk';
import { format } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { comments_schema } from '../schema';
import { getAssetUrl } from '../utils/get-asset-url';
import { userName } from '../utils/user-name';

const props = defineProps<{
	comment: Activity;
	refresh: () => Promise<void>;
}>();

defineEmits(['edit']);

const { t } = useI18n();
const api = useApi();
const { useNotificationsStore, useUserStore } = useStores();
const notificationStore = useNotificationsStore();
const userStore = useUserStore();
const currentUser = userStore.currentUser;

const formattedTime = computed(() => {
	if (props.comment.date_created) {
		return format(new Date(props.comment.date_created), String(t('date-fns_time_no_seconds')));
	}

	return null;
});

const avatarSource = computed(() => {
	if (!props.comment.user_created?.avatar)
		return null;

	return getAssetUrl(`${props.comment.user_created.avatar.id}?key=system-small-cover`);
});

const { confirmDelete, deleting, remove } = useDelete();

function useDelete() {
	const confirmDelete = ref(false);
	const deleting = ref(false);

	return { confirmDelete, deleting, remove };

	async function remove() {
		deleting.value = true;

		try {
			await api.delete(`/${comments_schema.endpoint}/${props.comment.id}`);
			await props.refresh();
			confirmDelete.value = false;
		}
		catch (error: any) {
			const code
					= error?.response?.data?.errors?.[0]?.extensions?.code
						|| error?.extensions?.code
						|| 'UNKNOWN';

			console.warn(error);

			notificationStore.add({
				title: code,
				type: 'error',
				code,
				dialog: true,
				error,
			});
		}
		finally {
			deleting.value = false;
		}
	}
}
</script>

<template>
	<div class="comment-header">
		<v-avatar x-small>
			<v-image v-if="avatarSource" :src="avatarSource" :alt="userName(comment.user_created)" />
			<v-icon v-else name="person_outline" />
		</v-avatar>

		<div class="name">
			<user-popover v-if="comment.user_created && comment.user_created.id" :user="comment.user_created.id">
				<span>
					{{ userName(comment.user_created) }}
				</span>
			</user-popover>
			<span v-else>
				{{ t('private_user') }}
			</span>
		</div>

		<div class="header-right">
			<v-menu v-if="currentUser.id == comment.user_created.id || currentUser?.role?.admin_access || currentUser?.admin_access" show-arrow placement="bottom-end">
				<template #activator="{ toggle, active }">
					<v-icon class="more" :class="{ active }" name="more_horiz" clickable @click="toggle" />
					<div class="time">
						{{ formattedTime }}
					</div>
				</template>

				<v-list>
					<v-list-item clickable @click="$emit('edit')">
						<v-list-item-icon><v-icon name="edit" /></v-list-item-icon>
						<v-list-item-content>{{ t('edit') }}</v-list-item-content>
					</v-list-item>
					<v-list-item clickable @click="confirmDelete = true">
						<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
						<v-list-item-content>{{ t('delete_label') }}</v-list-item-content>
					</v-list-item>
				</v-list>
			</v-menu>
			<div v-else class="time">
				{{ formattedTime }}
			</div>
		</div>

		<v-dialog v-model="confirmDelete" @esc="confirmDelete = false">
			<v-card>
				<v-card-title>{{ t('delete_comment') }}</v-card-title>
				<v-card-text>{{ t('delete_are_you_sure') }}</v-card-text>

				<v-card-actions>
					<v-button secondary @click="confirmDelete = false">
						{{ t('cancel') }}
					</v-button>
					<v-button kind="danger" :loading="deleting" @click="remove">
						{{ t('delete_label') }}
					</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</div>
</template>

<style scoped>
	.comment-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 8px;
}

.comment-header .v-avatar {
	--v-avatar-color: var(--theme--background-accent);

	flex-basis: 24px;
	margin-right: 8px;
}

.comment-header .v-avatar .v-icon {
	--v-icon-color: var(--theme--foreground-subdued);
}

.comment-header .name {
	flex-grow: 1;
	margin-right: 8px;
	font-weight: 600;
}

.comment-header .header-right {
	position: relative;
	flex-basis: 24px;
	color: var(--theme--foreground-subdued);
}

.comment-header .header-right .more {
	cursor: pointer;
	opacity: 0;
	transition: all var(--slow) var(--transition);
}

.comment-header .header-right .more:hover {
	color: var(--theme--foreground);
}

.comment-header .header-right .more.active {
	opacity: 1;
}

.comment-header .header-right .time {
	position: absolute;
	top: 0;
	right: 0;
	display: flex;
	align-items: center;
	font-size: 12px;
	white-space: nowrap;
	text-align: right;
	text-transform: lowercase;
	opacity: 1;
	transition: opacity var(--slow) var(--transition);
	pointer-events: none;
}

.comment-header .header-right > .time {
	position: relative;
	top: auto;
	right: auto;
	opacity: 1;
}

.comment-header .header-right .more.active + .time {
	opacity: 0;
}

.action-delete {
	--v-button-background-color: var(--danger-25);
	--v-button-color: var(--theme--danger);
	--v-button-background-color-hover: var(--danger-50);
	--v-button-color-hover: var(--theme--danger);
}

.dot {
	display: inline-block;
	width: 6px;
	height: 6px;
	margin-right: 4px;
	vertical-align: middle;
	background-color: var(--theme--warning);
	border-radius: 3px;
}
</style>
