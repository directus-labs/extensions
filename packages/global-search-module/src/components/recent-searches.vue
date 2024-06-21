<script setup lang="ts">
import { computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { orderBy, groupBy } from 'lodash-es';
import { format, isThisYear, isToday, isYesterday } from 'date-fns';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['updateQuery']);

const searchHistory = useStorage('search-history', []);

const { t } = useI18n();

function formatTime(time: string) {
	return format(new Date(time), String(t('date-fns_time_no_seconds')));
}

const groupedSearches = computed(() => {
	const searchesByDate = groupBy(searchHistory.value, (search: { timestamp: string; query: string }) => {
		const date = new Date(search.timestamp).toDateString();
		return date;
	});

	const groups = [];

	for (const [key, value] of Object.entries(searchesByDate)) {
		const date = new Date(key);
		const today = isToday(date);
		const yesterday = isYesterday(date);
		const thisYear = isThisYear(date);

		let dateFormatted: string;

		if (today) dateFormatted = String(t('today'));
		else if (yesterday) dateFormatted = String(t('yesterday'));
		else if (thisYear) dateFormatted = String(t('date-fns_date_short_no_year'));
		else dateFormatted = String(t('date-fns_date_short'));

		groups.push({
			date: date,
			dateFormatted: String(dateFormatted),
			searches: orderBy(value, ['timestamp'], ['desc']),
		});
	}

	return orderBy(groups, ['date'], ['desc']);
});

</script>

<template>
	<v-list v-if="searchHistory">
		<template v-for="group in groupedSearches" :key="group.key">
			<v-divider>{{ group.dateFormatted }}</v-divider>
			<v-list-item
				v-for="search in group.searches"
				:key="search.query"
				clickable
				block
				@click="
					emit('updateQuery', {
						query: search.query,
					})
				"
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

	<v-button @click="searchHistory = []" kind="secondary" full-width>
		<v-icon name="history_toggle_off" style="margin-right: 8px" />
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
.hit-description {
	color: var(--theme--foreground-subdued);
}
</style>
