<script setup lang="ts">
import type { SettingsSection } from './sections';
import { useStores } from '@directus/extensions-sdk';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Empty, Item, List, useCommandContext } from '../../command-palette';
import { rankItems } from '../../command-palette/utils/rank-items';
import { getSettingsSections } from './sections';

const router = useRouter();
const { search, close } = useCommandContext();
const sections = getSettingsSections(useStores());

const filteredSections = computed(() =>
	rankItems(sections, search.value, (section) => ({
		value: section.name,
		keywords: [section.id, 'settings', 'admin'],
	})).map(({ item }) => item),
);

function selectSection(section: SettingsSection) {
	router.push(section.to);
	close();
}
</script>

<template>
	<List search-bar-placeholder="Settings...">
		<Empty v-if="filteredSections.length === 0" />
		<Item
			v-for="section in filteredSections"
			:key="section.id"
			:value="section.id"
			:icon="section.icon"
			@select="selectSection(section)"
		>
			{{ section.name }}
		</Item>
	</List>
</template>
