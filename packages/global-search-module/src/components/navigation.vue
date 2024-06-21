<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useIsAdmin } from '../composables/use-is-admin';
const route = useRoute();

defineOptions({
	name: 'SearchNavigation',
	inheritAttrs: false,
});

const isAdmin = useIsAdmin();

const pages = [
	{ title: 'Search', name: 'global-search-index', icon: 'search' },
  ...(isAdmin.value ? [{ title: 'Settings', name: 'global-search-settings', icon: 'settings' }] : [])
];
</script>

<template>
	<v-list nav>
		<v-list-item
			v-for="item in pages"
			:key="item.name"
			:to="{ name: item.name }"
			:active="route.name === item.name"
		>
			<v-list-item-icon><v-icon :name="item.icon" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="item.title" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>
