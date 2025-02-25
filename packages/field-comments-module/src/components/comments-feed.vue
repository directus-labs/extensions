<script setup lang="ts">
import type { Comment, PrimaryKey } from '@directus/types';
import type { Locale } from 'date-fns';
import type { App, Ref } from 'vue';
import type { Activity, CommentsByDateDisplay } from '../types';
import { STORES_INJECT } from '@directus/constants';
import { useApi, useStores } from '@directus/extensions-sdk';
import { format as formatOriginal, isThisYear, isToday, isYesterday } from 'date-fns';
import dompurify from 'dompurify';
import { flatten, groupBy, orderBy } from 'lodash-es';
import { createApp, inject, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { routerKey } from 'vue-router';
import { comments_schema } from '../schema';
import { getDirectusApp, getDirectusAppProvides } from '../utils/get-directus-app';
import { userName } from '../utils/user-name';
import CommentInput from './comment-input.vue';
import CommentItem from './comment-item.vue';
import FieldLabel from './field-label.vue';

    type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

const props = defineProps<{
	collection: string;
	field: number;
	primaryKey: string | number;
}>();

const { t, locale } = useI18n();
const api = useApi();
const { usePermissionsStore } = useStores();
const permissionStore = usePermissionsStore();
const { hasPermission } = permissionStore;
const canAddComments = hasPermission('directus_comments', 'create');
const canReadComments = hasPermission('directus_comments', 'read');

const locales: { lang: string; locale: Locale }[] = [];

const collection = ref(props.collection);
const primaryKey = ref(props.primaryKey);
const field = ref(props.field);

const { comments, getComments, loading, refresh, getCommentsCount, userPreviews } =
        useComments(collection, field, primaryKey);

onMounted(() => {
	getCommentsCount();
	getComments();
});

const localizedFormat: LocalizedFormat = (date, format, options): string => {
	return formatOriginal(date, format, {
		...options,
		locale: getDateFNSLocale(),
	});
};

function useComments(collection: Ref<string>, field: Ref<number>, primaryKey: Ref<PrimaryKey>) {
	const regex = /\s@[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/gi;
	const comments = ref<CommentsByDateDisplay[] | null>(null);
	const commentsCount = ref(0);
	const error = ref(null);
	const loading = ref(false);
	const loadingCount = ref(false);
	const userPreviews = ref<Record<string, any>>({});

	watch([collection, field, primaryKey], () => refresh());

	return {
		comments,
		getComments,
		error,
		loading,
		refresh,
		commentsCount,
		getCommentsCount,
		loadingCount,
		userPreviews,
	};

	async function getComments() {
		error.value = null;
		loading.value = true;

		try {
			const response = hasPermission(comments_schema.table, 'read')
				? (
						await api.get(`/${comments_schema.endpoint}`, {
							params: {
								__field_comments__: true,
								filter: {
									collection: {
										_eq: collection.value,
									},
									item: {
										_eq: primaryKey.value,
									},
									field: {
										_eq: field.value,
									},
								},
								sort: '-date_created',
								fields: [
									'id',
									'comment',
									'date_created',
									'user_created.id',
									'user_created.email',
									'user_created.first_name',
									'user_created.last_name',
									'user_created.avatar.id',
								],
							},
						})
					).data.data as Comment[]
				: [];

			userPreviews.value = await loadUserPreviews(response, regex);

			const commentsWithTaggedUsers = (response as Comment[]).map((c) => {
				const display = dompurify
					.sanitize(c.comment as string, { ALLOWED_TAGS: [] })
					.replaceAll(regex, (match) => `<mark>${userPreviews.value[match.slice(2)]}</mark>`);

				return {
					...c,
					display,
				} as Activity;
			});

			const commentsByDate = groupBy(commentsWithTaggedUsers, (activity: Activity) => {
				const date = new Date(new Date(activity.date_created).toDateString());
				return date;
			});

			const commentsGrouped: CommentsByDateDisplay[] = [];

			for (const [key, value] of Object.entries(commentsByDate)) {
				const date = new Date(key);
				const today = isToday(date);
				const yesterday = isYesterday(date);
				const thisYear = isThisYear(date);

				let dateFormatted: string;

				if (today)
					dateFormatted = t('today');
				else if (yesterday)
					dateFormatted = t('yesterday');
				else if (thisYear)
					dateFormatted = localizedFormat(date, String(t('date-fns_date_short_no_year')));
				else dateFormatted = localizedFormat(date, String(t('date-fns_date_short')));

				commentsGrouped.push({
					date,
					dateFormatted: String(dateFormatted),
					comments: value as Activity[],
				});
			}

			comments.value = orderBy(commentsGrouped, ['date'], ['desc']);
		}
		catch (error: any) {
			error.value = error;
		}
		finally {
			loading.value = false;
		}
	}

	async function getCommentsCount() {
		error.value = null;
		loadingCount.value = true;

		try {
			const response = hasPermission(comments_schema.table, 'read')
				? await api.get(`/${comments_schema.endpoint}`, {
					params: {
						__field_comments__: true,
						filter: {
							_and: [
								{
									collection: {
										_eq: collection.value,
									},
								},
								{
									item: {
										_eq: primaryKey.value,
									},
								},
								{
									field: {
										_eq: field.value,
									},
								},
							],
						},
						aggregate: {
							count: 'id',
						},
					},
				})
				: { data: [{ count: { id: 0 } }] };

			commentsCount.value = Number(response.data.data[0].count.id);

			const fieldLabelExtension = document.querySelector(`#field-comments-${field.value}`);
			const Badge = fieldLabelExtension?.querySelector<Element>('.badge span');

			if (Badge) {
				Badge.innerHTML = String(commentsCount.value);
			}
			else {
				let app: App | null = null;
				const directusApp = getDirectusApp();
				const injects = getDirectusAppProvides(directusApp);
				app = createApp(FieldLabel, { count: commentsCount.value });
				app.provide(STORES_INJECT, injects[STORES_INJECT]);

				directusApp.runWithContext(() => {
					app!.provide(routerKey, inject(routerKey)!);
				});

				app.mount(fieldLabelExtension);
			}
		}
		catch (error: any) {
			error.value = error;
		}
		finally {
			loadingCount.value = false;
		}
	}

	async function refresh() {
		await getCommentsCount();
		await getComments();
	}
}

async function loadUserPreviews(comments: Comment[], regex: RegExp) {
	const userPreviews: any[] = [];

	comments.forEach((c: Comment) => {
		userPreviews.push(c.comment.match(regex) as string[]);
	});

	// eslint-disable-next-line array-callback-return
	const uniqIds: string[] = ([...new Set(flatten(userPreviews))]).filter((id) => {
		if (id)
			return id;
	}) as string[];

	if (uniqIds.length > 0) {
		const response = await api.get('/users', {
			params: {
				filter: { id: { _in: uniqIds.map((id) => id.slice(2)) } },
				fields: ['first_name', 'last_name', 'email', 'id'],
			},
		});

		const userPreviews: Record<string, string> = {};

		// eslint-disable-next-line array-callback-return
		response.data.data.map((user: Record<string, any>) => {
			userPreviews[user.id] = userName(user) ?? t('unknown_user') as string;
		});

		return userPreviews;
	}

	return {};
}

function getDateFNSLocale(): Locale | undefined {
	const currentLang = locale.value;
	return locales.find(({ lang }) => currentLang === lang)?.locale;
}
</script>

<template>
	<CommentInput v-if="canAddComments" :refresh="refresh" :collection="collection" :field="field" :primary-key="primaryKey" />
	<v-notice v-else-if="canReadComments">
		You do not have permissions to leave comments.
	</v-notice>
	<v-notice v-else>
		You do not have permissions to view these comments.
	</v-notice>

	<v-progress-linear v-if="loading" indeterminate />

	<div v-else-if="!comments || comments.length === 0" class="empty">
		<div v-if="canReadComments" class="content">
			{{ t("no_comments") }}
		</div>
	</div>

	<template v-for="group in comments" v-else :key="group.date.toString()">
		<v-divider>{{ group.dateFormatted }}</v-divider>

		<template v-for="item in group.comments" :key="item.id">
			<CommentItem
				:refresh="refresh"
				:comment="item"
				:user-previews="userPreviews"
				:primary-key="primaryKey"
				:collection="collection"
				:field="field"
			/>
		</template>
	</template>
</template>

<style scoped>
    .v-progress-linear {
	margin: 24px 0;
}

.v-divider {
	position: sticky;
	top: 0;
	z-index: 2;
	margin-top: 12px;
	margin-bottom: 2px;
	padding-top: 4px;
	padding-bottom: 4px;
	--v-divider-label-color: var(--theme--foreground-subdued);
}

.v-notice {
	background-color: var(--theme--background);
}

.empty {
	margin-top: 16px;
	margin-bottom: 8px;
	margin-left: 2px;
	color: var(--theme--foreground-subdued);
	font-style: italic;
}
</style>
