<script setup lang="ts">
    import { useApi, useStores } from "@directus/extensions-sdk";
    import { STORES_INJECT } from "@directus/constants";
    import type { Comment, PrimaryKey, User } from "@directus/types";
    import type { Locale } from "date-fns";
    import { schema_collection_name } from "../schema";
    import { isThisYear, isToday, isYesterday } from "date-fns";
    import { format as formatOriginal } from "date-fns";
    import { flatten, groupBy, orderBy } from "lodash";
    import { App, createApp, inject, Ref, onMounted, ref, watch } from "vue";
    import { useI18n } from "vue-i18n";
    import { routerKey } from "vue-router";
    import dompurify from "dompurify";
    import { getDirectusApp, getDirectusAppProvides } from "../utils/get-directus-app";
    import FieldLabel from "./field-label.vue";
    import CommentInput from "./comment-input.vue";
    import CommentItem from "./comment-item.vue";
    import { userName } from "../utils/user-name"


    type CommentsByDateDisplay = {
        date: Date;
        dateFormatted: string;
        comments: (Comment & {
            display: string;
            user_created: Pick<User, 'id' | 'email' | 'first_name' | 'last_name' | 'avatar'>;
        })[];
    };

    type LocalizedFormat = (...a: Parameters<typeof formatOriginal>) => string;

    const props = defineProps<{
        collection: string,
        field: number,
        primaryKey: string | number,
    }>();

    const { t, locale } = useI18n();
    const api = useApi();
    const { usePermissionsStore } = useStores();
    const permissionStore = usePermissionsStore();
    const { hasPermission } = permissionStore;
    const canAddComments = hasPermission(schema_collection_name, "create");
    const canReadComments = hasPermission(schema_collection_name, "read");

    const locales: { lang: string; locale: Locale }[] = [];

    const collection = ref(props.collection);
    const primaryKey = ref(props.primaryKey);
    const field = ref(props.field);

    const { comments, getComments, loading, refresh, commentsCount, getCommentsCount, loadingCount, userPreviews } =
        useComments(collection, field, primaryKey);

    onMounted(() => {
        getCommentsCount();
        getComments();
    });

    function useComments(collection: Ref<string>, field: Ref<number>, primaryKey: Ref<PrimaryKey>) {
        const regex = /\s@[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}/gm;
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
                const response = hasPermission(schema_collection_name, "read") ? (
                    await api.get(`/items/${schema_collection_name}`, {
                        params: {
                            "filter[comment][collection][_eq]": collection.value,
                            "filter[comment][item][_eq]": primaryKey.value,
                            "filter[field][_eq]": field.value,
                            sort: "-comment.date_created",
                            fields: [
                                "comment.id",
                                "comment.comment",
                                "comment.date_created",
                                "comment.user_created.id",
                                "comment.user_created.email",
                                "comment.user_created.first_name",
                                "comment.user_created.last_name",
                                "comment.user_created.avatar.id",
                            ],
                        },
                    })
                ).data.data as Record<string,Comment>[] : [];

                userPreviews.value = await loadUserPreviews(response, regex);

                const commentsWithTaggedUsers = (response as Record<string,Comment>[]).map((c) => {
                    const display = dompurify
                        .sanitize(c.comment?.comment as string, { ALLOWED_TAGS: [] })
                        .replace(regex, (match) => `<mark>${userPreviews.value[match.substring(2)]}</mark>`);

                    return {
                        ...c.comment,
                        display,
                    } as Comment & {
                        display: string;
                        user_created: Pick<User, "id" | "email" | "first_name" | "last_name" | "avatar">;
                    };
                });

                const commentsByDate = groupBy(commentsWithTaggedUsers, (activity) => {
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

                    if (today) dateFormatted = t("today");
                    else if (yesterday) dateFormatted = t("yesterday");
                    else if (thisYear) dateFormatted = localizedFormat(date, String(t("date-fns_date_short_no_year")));
                    else dateFormatted = localizedFormat(date, String(t("date-fns_date_short")));

                    commentsGrouped.push({
                        date: date,
                        dateFormatted: String(dateFormatted),
                        comments: value,
                    });
                }

                comments.value = orderBy(commentsGrouped, ["date"], ["desc"]);
            } catch (error: any) {
                error.value = error;
            } finally {
                loading.value = false;
            }
        }

        async function getCommentsCount() {
            error.value = null;
            loadingCount.value = true;

            try {
                const response = hasPermission(schema_collection_name, "read") ? await api.get(`/items/${schema_collection_name}`, {
                    params: {
                        filter: {
                            _and: [
                                {
                                    comment: {
                                        collection: {
                                            _eq: collection.value,
                                        },
                                    }
                                },
                                {
                                    comment: {
                                        item: {
                                            _eq: primaryKey.value,
                                        },
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
                            count: "id",
                        },
                    },
                }) : {data:[{count:{id:0}}]};

                commentsCount.value = Number(response.data.data[0].count.id);

                const fieldLabelExtension = document.getElementById(`field-comments-${field.value}`);
                const Badge = fieldLabelExtension?.querySelector<Element>(".badge span");

                if(Badge){
                    Badge.innerHTML = String(commentsCount.value);
                } else {
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

            } catch (error: any) {
                error.value = error;
            } finally {
                loadingCount.value = false;
            }
        }

        async function refresh() {
            await getCommentsCount();
            await getComments();
        }
    }

    async function loadUserPreviews(comments: Record<string,Comment>[], regex: RegExp) {
        const userPreviews: any[] = [];

        comments.forEach((c: Record<string, Comment>) => {
            userPreviews.push(c.comment?.comment.match(regex));
        });

        const uniqIds: string[] = [...new Set(flatten(userPreviews))].filter((id) => {
            if (id) return id;
        });

        if (uniqIds.length > 0) {
            const response = await api.get("/users", {
                params: {
                    filter: { id: { _in: uniqIds.map((id) => id.substring(2)) } },
                    fields: ["first_name", "last_name", "email", "id"],
                },
            });

            const userPreviews: Record<string, string> = {};

            response.data.data.map((user: Record<string, any>) => {
                userPreviews[user.id] = userName(user) ?? t("unknown_user") as string;
            });

            return userPreviews;
        }

        return {};
    }

    

    const localizedFormat: LocalizedFormat = (date, format, options): string => {
        return formatOriginal(date, format, {
            ...options,
            locale: getDateFNSLocale(),
        });
    };

    function getDateFNSLocale(): Locale | undefined {
        const currentLang = locale.value;
        return locales.find(({ lang }) => currentLang === lang)?.locale;
    }
</script>
<template>

    <comment-input v-if="canAddComments" :refresh="refresh" :collection="collection" :field="field" :primary-key="primaryKey" />
    <v-notice v-else-if="canReadComments">You do not have permissions to leave comments.</v-notice>
    <v-notice v-else>You do not have permissions to view these comments.</v-notice>

    <v-progress-linear v-if="loading" indeterminate />

    <div v-else-if="!comments || comments.length === 0" class="empty">
        <div v-if="canReadComments" class="content">{{ t("no_comments") }}</div>
    </div>

    <template v-for="group in comments" v-else :key="group.date.toString()">
        <v-divider>{{ group.dateFormatted }}</v-divider>

        <template v-for="item in group.comments" :key="item.id">
            <comment-item
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