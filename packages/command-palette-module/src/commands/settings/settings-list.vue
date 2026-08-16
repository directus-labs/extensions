<script setup lang="ts">
import type { SettingsSection } from './sections';
import { useStores } from '@directus/extensions-sdk';
import { useRouter } from 'vue-router';
import { Empty, Item, List, useCommandContext } from '../../command-palette';
import { getSettingsSections } from './sections';

const router = useRouter();
const { close } = useCommandContext();
const sections = getSettingsSections(useStores());

function selectSection(section: SettingsSection) {
	router.push(section.to);
	close();
}
</script>

<template>
	<List search-bar-placeholder="Settings...">
		<Empty />
		<Item
			v-for="section in sections"
			:key="section.id"
			:value="section.name"
			:keywords="[section.id, 'settings', 'admin']"
			:icon="section.icon"
			@select="selectSection(section)"
		>
			{{ section.name }}
		</Item>
	</List>
</template>
