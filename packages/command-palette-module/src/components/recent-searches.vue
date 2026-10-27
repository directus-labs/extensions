<script setup lang="ts">
import type { RecentSearch } from '../composables/use-recent-searches';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { groupBy, orderBy } from 'lodash-es';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	searches: RecentSearch[];
}>();

const emit = defineEmits<{
	clear: [];
	select: [query: string];
}>();

const { t } = useI18n();

const groupedSearches = computed(() => {
	const searchesByDate = groupBy(props.searches, (search) =>
		new Date(search.timestamp).toDateString());

	return orderBy(
		Object.entries(searchesByDate).map(([key, searches]) => {
			const date = new Date(key);
			let dateFormatted: string;

			if (isToday(date)) dateFormatted = String(t('today'));
			else if (isYesterday(date)) dateFormatted = String(t('yesterday'));
			else if (isThisYear(date)) dateFormatted = format(date, String(t('date-fns_date_short_no_year')));
			else dateFormatted = format(date, String(t('date-fns_date_short')));

			return { date, dateFormatted, searches: orderBy(searches, ['timestamp'], ['desc']) };
		}),
		['date'],
		['desc'],
	);
});

function formatTime(timestamp: string) {
	return format(new Date(timestamp), String(t('date-fns_time_no_seconds')));
}
</script>

<template>
	<v-list v-if="searches.length > 0">
		<template v-for="group in groupedSearches" :key="group.date.toISOString()">
			<v-divider>{{ group.dateFormatted }}</v-divider>
			<v-list-item
				v-for="search in group.searches"
				:key="search.query"
				clickable
				block
				@click="emit('select', search.query)"
			>
				<v-list-item-content>
					<div class="search-title">
						<div>{{ search.query }}</div>
						<div class="time">
							{{ formatTime(search.timestamp) }}
						</div>
					</div>
				</v-list-item-content>
			</v-list-item>
		</template>
	</v-list>

	<v-button v-if="searches.length > 0" class="clear" secondary small @click="emit('clear')">
		<v-icon name="history_toggle_off" />
		Clear History
	</v-button>
</template>

<style scoped>
.search-title {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
}

.clear {
	margin-top: 8px;
}

.time {
	color: var(--theme--foreground-subdued);
}
</style>
